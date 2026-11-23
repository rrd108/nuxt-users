import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type { AuthenticationResponseJSON, RegistrationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server'
import type { ModuleOptions, PasskeyAcceptedCredentials, PasskeyUnknownCredential, UserWithoutPassword } from 'nuxt-users/utils'
import {
  addPasskey,
  consumeChallenge,
  findPasskeyByCredentialId,
  findUserHandle,
  getOrCreateUserHandle,
  listPasskeys,
  PasskeyUserHandleConflictError,
  saveChallenge,
  updatePasskeyCounter,
} from '../utils/passkey'
import type { Passkey } from '../utils/passkey'
import { findUserById } from '../utils/user'

/** An expected failure of a passkey ceremony, carrying the HTTP status the API should answer with */
export class PasskeyError extends Error {
  statusCode: number
  /** Details the client may act on, sent as the `data` of the HTTP error */
  data?: PasskeyUnknownCredential

  constructor(message: string, statusCode: number, data?: PasskeyUnknownCredential) {
    super(message)
    this.name = 'PasskeyError'
    this.statusCode = statusCode
    this.data = data
  }
}

export interface ResolvedPasskeyConfig {
  rpID: string
  rpName: string
  origins: string[]
  userVerification: 'required' | 'preferred' | 'discouraged'
}

/**
 * Origins as configured: an array, or a string (what an environment variable gives, as Nitro cannot
 * fill array items): a comma-separated list or a JSON array. Trailing slashes are dropped.
 */
export const normalizeOrigins = (origins: unknown): string[] => {
  const list: unknown[] = Array.isArray(origins) ? origins : typeof origins === 'string' ? origins.split(',') : []
  return list
    .filter((origin): origin is string => typeof origin === 'string')
    .map(origin => origin.trim().replace(/^\[?["']?|["']?\]?$/g, '').replace(/\/+$/, ''))
    .filter(Boolean)
}

/** The explicit origins, else the origin of the configured siteUrl (never of the request) */
const resolveOrigins = (options: ModuleOptions): string[] => {
  const origins = normalizeOrigins(options.auth.passkey?.origins)
  if (origins.length || !options.siteUrl) {
    return origins
  }
  try {
    return [new URL(options.siteUrl).origin]
  }
  catch {
    return []
  }
}

/** The explicit rpId, else the host of the configured siteUrl (never of the request) */
const resolveRpId = (options: ModuleOptions): string => {
  if (options.auth.passkey?.rpId) {
    return options.auth.passkey.rpId
  }
  try {
    return options.siteUrl ? new URL(options.siteUrl).hostname : ''
  }
  catch {
    return ''
  }
}

export const resolvePasskeyConfig = (options: ModuleOptions): ResolvedPasskeyConfig => {
  const passkey = options.auth.passkey
  if (!passkey) {
    throw new PasskeyError('Passkeys are not enabled', 404)
  }
  const origins = resolveOrigins(options)
  const rpId = resolveRpId(options)

  const isProduction = process.env.NODE_ENV === 'production'
  // The relying party is never guessed from the request: the Host header can be spoofed or rewritten by a proxy
  if (isProduction && !rpId) {
    throw new PasskeyError('[Nuxt Users] auth.passkey.rpId (or siteUrl) is required in production', 500)
  }
  if (isProduction && !origins.length) {
    throw new PasskeyError('[Nuxt Users] auth.passkey.origins (or siteUrl) is required in production', 500)
  }

  return {
    rpID: rpId || 'localhost',
    rpName: passkey.rpName || 'Nuxt Users',
    origins: origins.length ? origins : ['http://localhost:3000'],
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

  // The authenticator keeps this handle, so the passkey must be saved with exactly this one
  await saveChallenge(options, { challenge: registrationOptions.challenge, type: 'registration', userId: user.id, userHandle })
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
  if (!stored || stored.userId !== user.id || !stored.userHandle) {
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
  // The handle sent to the authenticator at the start, not a newly generated one (issue #224)
  const userHandle = stored.userHandle

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
    // A concurrent first registration of this user saved its passkey first, with another handle
    if (error instanceof PasskeyUserHandleConflictError) {
      throw new PasskeyError('Another passkey was registered at the same time, please try again', 409)
    }
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
  const invalid = (reason?: string) => {
    if (reason) {
      console.warn(`[Nuxt Users] Passkey login rejected: ${reason}`)
    }
    return new PasskeyError('Invalid passkey', 401)
  }

  const challenge = readChallenge(response.response.clientDataJSON)
  if (!await consumeChallenge(options, challenge, 'authentication')) {
    throw invalid('the challenge is unknown, expired or already used')
  }

  const passkey = await findPasskeyByCredentialId(options, response.id)
  if (!passkey) {
    // Only after a valid challenge: the credential id comes from the browser and says nothing about accounts.
    // Naming it lets the browser drop the removed passkey from the authenticator (WebAuthn Signal API).
    console.warn(`[Nuxt Users] Passkey login rejected: no stored passkey matches the credential id "${response.id}"`)
    throw new PasskeyError('Unknown passkey', 401, { code: 'unknown_credential', rpId: config.rpID, credentialId: response.id })
  }

  // A discoverable credential reports whose it is: it must be the account the credential is stored for
  const { userHandle } = response.response
  if (userHandle && userHandle !== passkey.user_handle) {
    throw invalid('the user handle of the response does not match the stored passkey')
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
    throw invalid('the signature was not verified')
  }

  // A counter that does not increase hints at a cloned authenticator. Synced passkeys always report 0, which is fine.
  const { newCounter } = verification.authenticationInfo
  if ((passkey.counter > 0 || newCounter > 0) && newCounter <= passkey.counter) {
    console.warn('[Nuxt Users] Passkey counter did not increase, possible cloned credential. Login rejected:', { passkeyId: passkey.id, userId: passkey.user_id })
    throw invalid()
  }

  const user = await findUserById(passkey.user_id, options)
  if (!user) {
    throw invalid('the passkey belongs to a user that no longer exists')
  }
  // Compare-and-set: a concurrent login that already used this counter value loses
  if (!await updatePasskeyCounter(options, passkey.id, newCounter)) {
    console.warn('[Nuxt Users] Passkey counter was already used by a concurrent login. Login rejected:', { passkeyId: passkey.id, userId: passkey.user_id })
    throw invalid()
  }
  return user
}

/**
 * The passkeys a user still has, for the browser to tell the authenticators (WebAuthn Signal API), so a
 * removed passkey disappears from the device while the user's other passkeys stay. Null when the user never
 * started a passkey registration, as authenticators then hold nothing under a handle of theirs.
 */
export const getAcceptedPasskeyCredentials = async (options: ModuleOptions, userId: number): Promise<PasskeyAcceptedCredentials | null> => {
  const config = resolvePasskeyConfig(options)
  const userHandle = await findUserHandle(options, userId)
  if (!userHandle) {
    return null
  }
  const passkeys = await listPasskeys(options, userId)
  return { rpId: config.rpID, userId: userHandle, allAcceptedCredentialIds: passkeys.map(passkey => passkey.credential_id) }
}
