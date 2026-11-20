import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type { AuthenticationResponseJSON, RegistrationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server'
import type { ModuleOptions, UserWithoutPassword } from 'nuxt-users/utils'
import {
  addPasskey,
  consumeChallenge,
  findPasskeyByCredentialId,
  getOrCreateUserHandle,
  listPasskeys,
  saveChallenge,
  updatePasskeyCounter,
} from '../utils/passkey'
import type { Passkey } from '../utils/passkey'
import { findUserById } from '../utils/user'

/** An expected failure of a passkey ceremony, carrying the HTTP status the API should answer with */
export class PasskeyError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'PasskeyError'
    this.statusCode = statusCode
  }
}

export interface ResolvedPasskeyConfig {
  rpID: string
  rpName: string
  origins: string[]
  userVerification: 'required' | 'preferred' | 'discouraged'
}

export const resolvePasskeyConfig = (options: ModuleOptions): ResolvedPasskeyConfig => {
  const passkey = options.auth.passkey
  if (!passkey) {
    throw new PasskeyError('Passkeys are not enabled', 404)
  }

  const isProduction = process.env.NODE_ENV === 'production'
  // The relying party is never guessed from the request: the Host header can be spoofed or rewritten by a proxy
  if (isProduction && !passkey.rpId) {
    throw new PasskeyError('[Nuxt Users] auth.passkey.rpId is required in production', 500)
  }
  if (isProduction && !passkey.origins?.length) {
    throw new PasskeyError('[Nuxt Users] auth.passkey.origins is required in production', 500)
  }

  return {
    rpID: passkey.rpId || 'localhost',
    rpName: passkey.rpName || 'Nuxt Users',
    origins: passkey.origins?.length ? passkey.origins : ['http://localhost:3000'],
    userVerification: passkey.userVerification || 'preferred',
  }
}

/** The challenge the browser signed, read from clientDataJSON, so the right stored challenge can be consumed */
const readChallenge = (clientDataJSON: string): string => {
  try {
    const challenge = JSON.parse(Buffer.from(clientDataJSON, 'base64url').toString('utf8')).challenge
    if (typeof challenge === 'string' && challenge) {
      return challenge
    }
  }
  catch {
    // fall through
  }
  throw new PasskeyError('Invalid passkey response', 400)
}

export const beginPasskeyRegistration = async (
  options: ModuleOptions,
  user: Pick<UserWithoutPassword, 'id' | 'email' | 'name'>
): Promise<PublicKeyCredentialCreationOptionsJSON> => {
  const config = resolvePasskeyConfig(options)
  const existing = await listPasskeys(options, user.id)
  const userHandle = await getOrCreateUserHandle(options, user.id)

  const registrationOptions = await generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userName: user.email,
    userDisplayName: user.name,
    userID: new Uint8Array(Buffer.from(userHandle, 'base64url')),
    attestationType: 'none',
    excludeCredentials: existing.map(passkey => ({ id: passkey.credential_id, transports: passkey.transports })),
    authenticatorSelection: { residentKey: 'required', userVerification: config.userVerification },
  })

  await saveChallenge(options, { challenge: registrationOptions.challenge, type: 'registration', userId: user.id })
  return registrationOptions
}

export const finishPasskeyRegistration = async (
  options: ModuleOptions,
  user: Pick<UserWithoutPassword, 'id'>,
  response: RegistrationResponseJSON,
  name?: string
): Promise<Passkey> => {
  const config = resolvePasskeyConfig(options)
  const challenge = readChallenge(response.response.clientDataJSON)

  const stored = await consumeChallenge(options, challenge, 'registration')
  if (!stored || stored.userId !== user.id) {
    throw new PasskeyError('Passkey registration expired or was not requested', 400)
  }

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: config.origins,
      expectedRPID: config.rpID,
      requireUserVerification: config.userVerification === 'required',
    })
  }
  catch (error) {
    console.warn('[Nuxt Users] Passkey registration verification failed:', error)
    throw new PasskeyError('Passkey registration could not be verified', 400)
  }
  if (!verification.verified) {
    throw new PasskeyError('Passkey registration could not be verified', 400)
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo
  const userHandle = await getOrCreateUserHandle(options, user.id)

  if (await findPasskeyByCredentialId(options, credential.id)) {
    throw new PasskeyError('This passkey is already registered', 409)
  }

  const newPasskey = {
    userId: user.id,
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    transports: credential.transports ?? response.response.transports,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    name: name?.trim() || `Passkey, ${new Date().toISOString().slice(0, 10)}`,
    userHandle,
  }

  try {
    return await addPasskey(options, newPasskey)
  }
  catch (error) {
    // Lost a race with a concurrent registration of the same credential (unique credential_id)
    if (await findPasskeyByCredentialId(options, credential.id)) {
      throw new PasskeyError('This passkey is already registered', 409)
    }
    throw error
  }
}

/** Usernameless: no credentials are allow-listed, so the response never reveals whether an account exists */
export const beginPasskeyLogin = async (options: ModuleOptions): Promise<PublicKeyCredentialRequestOptionsJSON> => {
  const config = resolvePasskeyConfig(options)

  const loginOptions = await generateAuthenticationOptions({
    rpID: config.rpID,
    userVerification: config.userVerification,
  })

  await saveChallenge(options, { challenge: loginOptions.challenge, type: 'authentication' })
  return loginOptions
}

export const finishPasskeyLogin = async (
  options: ModuleOptions,
  response: AuthenticationResponseJSON
): Promise<UserWithoutPassword> => {
  const config = resolvePasskeyConfig(options)
  const invalid = () => new PasskeyError('Invalid passkey', 401)

  const challenge = readChallenge(response.response.clientDataJSON)
  if (!await consumeChallenge(options, challenge, 'authentication')) {
    throw invalid()
  }

  const passkey = await findPasskeyByCredentialId(options, response.id)
  if (!passkey) {
    throw invalid()
  }

  // A discoverable credential reports whose it is: it must be the account the credential is stored for
  const { userHandle } = response.response
  if (userHandle && userHandle !== passkey.user_handle) {
    throw invalid()
  }

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: config.origins,
      expectedRPID: config.rpID,
      requireUserVerification: config.userVerification === 'required',
      credential: {
        id: passkey.credential_id,
        publicKey: new Uint8Array(Buffer.from(passkey.public_key, 'base64url')),
        counter: passkey.counter,
        transports: passkey.transports as never,
      },
    })
  }
  catch (error) {
    console.warn('[Nuxt Users] Passkey login verification failed:', error)
    throw invalid()
  }
  if (!verification.verified) {
    throw invalid()
  }

  // A counter that does not increase hints at a cloned authenticator. Synced passkeys always report 0, which is fine.
  const { newCounter } = verification.authenticationInfo
  if ((passkey.counter > 0 || newCounter > 0) && newCounter <= passkey.counter) {
    console.warn('[Nuxt Users] Passkey counter did not increase, possible cloned credential. Login rejected:', { passkeyId: passkey.id, userId: passkey.user_id })
    throw invalid()
  }

  const user = await findUserById(passkey.user_id, options)
  if (!user) {
    throw invalid()
  }
  // Soft-deleted and not yet email-confirmed users are both inactive, as for password login
  if (!user.active) {
    throw new PasskeyError('User account is inactive', 403)
  }

  // Compare-and-set: a concurrent login that already used this counter value loses
  if (!await updatePasskeyCounter(options, passkey.id, newCounter)) {
    console.warn('[Nuxt Users] Passkey counter was already used by a concurrent login. Login rejected:', { passkeyId: passkey.id, userId: passkey.user_id })
    throw invalid()
  }
  return user
}
