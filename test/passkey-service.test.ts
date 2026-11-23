import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Database } from 'db0'

import * as webauthn from '@simplewebauthn/server'
import { runMigrations } from '../src/runtime/server/utils/migrate'
import { createUser } from '../src/runtime/server/utils/user'
import { addPasskey, deletePasskey, findPasskeyByCredentialId, listPasskeys, saveChallenge } from '../src/runtime/server/utils/passkey'
import {
  PasskeyError,
  resolvePasskeyConfig,
  beginPasskeyRegistration,
  finishPasskeyRegistration,
  beginPasskeyLogin,
  finishPasskeyLogin,
  getAcceptedPasskeyCredentials,
} from '../src/runtime/server/services/passkey'
import { cleanupTestSetup, createTestSetup, getDatabaseConfig } from './test-setup'
import type { DatabaseType, ModuleOptions, User } from '../src/types'

vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn(async (opts: { challenge?: string }) => ({ challenge: `reg-${Math.random().toString(36).slice(2)}`, ...opts })),
  generateAuthenticationOptions: vi.fn(async () => ({ challenge: `auth-${Math.random().toString(36).slice(2)}` })),
  verifyRegistrationResponse: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}))

const clientData = (challenge: string) => Buffer.from(JSON.stringify({ challenge, type: 'webauthn.get' })).toString('base64url')

const registrationResponse = (challenge: string, id = 'new-cred') => ({
  id,
  rawId: id,
  type: 'public-key' as const,
  clientExtensionResults: {},
  response: { clientDataJSON: clientData(challenge), attestationObject: 'att', transports: ['internal'] },
})

const authenticationResponse = (challenge: string, id = 'cred-1') => ({
  id,
  rawId: id,
  type: 'public-key' as const,
  clientExtensionResults: {},
  response: { clientDataJSON: clientData(challenge), authenticatorData: 'ad', signature: 'sig' },
})

describe('Passkey service', () => {
  let db: Database
  let options: ModuleOptions
  let dbType: DatabaseType
  let user: User

  const passkeyOptions = { rpId: 'example.com', rpName: 'Example', origins: ['https://example.com'] }

  const verifiedLogin = (newCounter: number) => {
    vi.mocked(webauthn.verifyAuthenticationResponse).mockResolvedValue({
      verified: true,
      authenticationInfo: { credentialID: 'cred-1', newCounter, userVerified: true, credentialDeviceType: 'multiDevice', credentialBackedUp: true, origin: 'https://example.com', rpID: 'example.com' },
    })
  }

  const verifiedRegistration = (credentialId: string) => {
    vi.mocked(webauthn.verifyRegistrationResponse).mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: { id: credentialId, publicKey: new Uint8Array([1, 2, 3]), counter: 0, transports: ['internal'] },
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
      },
    } as never)
  }

  const storePasskeyFor = (userId: number, counter = 0, credentialId = 'cred-1') => addPasskey(options, {
    userId,
    credentialId,
    publicKey: Buffer.from('pk').toString('base64url'),
    counter,
    transports: ['internal'],
    deviceType: 'multiDevice',
    backedUp: true,
    name: 'Laptop',
    userHandle: 'handle-1',
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    const dbConfig = getDatabaseConfig(dbType)
    if (dbType === 'sqlite') {
      dbConfig.path = './_passkey_service_db'
    }
    const settings = await createTestSetup({ dbType, dbConfig })
    db = settings.db
    options = { ...settings.testOptions, auth: { ...settings.testOptions.auth, passkey: passkeyOptions } } as ModuleOptions
    // Start from a clean slate: other test files share the MySQL/PostgreSQL database and may leave tables behind
    if (dbType !== 'sqlite') {
      await dropAllTables()
    }
    await runMigrations(options)
    user = await createUser({ email: 'jane@example.com', name: 'Jane', password: 'Password123!' }, options) as User
  })

  const allTables = () => [options.tables.passkeys, options.tables.passkeyChallenges, options.tables.users, options.tables.personalAccessTokens, options.tables.passwordResetTokens, options.tables.migrations]

  const dropAllTables = async () => {
    for (const table of allTables()) {
      await cleanupTestSetup(dbType, db, [options.connector.options.path!], table)
    }
  }

  afterEach(dropAllTables)

  describe('resolvePasskeyConfig', () => {
    const resolveIn = (env: string, passkey?: ModuleOptions['auth']['passkey']) => {
      const previous = process.env.NODE_ENV
      process.env.NODE_ENV = env
      try {
        return resolvePasskeyConfig({ ...options, auth: { ...options.auth, passkey } } as ModuleOptions)
      }
      finally {
        process.env.NODE_ENV = previous
      }
    }

    it('uses the configured relying party', () => {
      expect(resolveIn('production', passkeyOptions)).toEqual({
        rpID: 'example.com',
        rpName: 'Example',
        origins: ['https://example.com'],
        userVerification: 'preferred',
      })
    })

    it('defaults to localhost in development', () => {
      expect(resolveIn('development', {})).toMatchObject({ rpID: 'localhost', origins: ['http://localhost:3000'], rpName: 'Nuxt Users' })
    })

    it('refuses to run in production without rpId and origins', () => {
      expect(() => resolveIn('production', {})).toThrow(/rpId/)
      expect(() => resolveIn('production', { rpId: 'example.com' })).toThrow(/origins/)
    })

    it('is disabled when auth.passkey is not set', () => {
      expect(() => resolveIn('development', undefined)).toThrow(PasskeyError)
    })
  })

  describe('registration', () => {
    it('asks for a discoverable credential and excludes the existing ones', async () => {
      await storePasskeyFor(user.id)

      await beginPasskeyRegistration(options, user)

      const call = vi.mocked(webauthn.generateRegistrationOptions).mock.calls[0]![0]
      expect(call).toMatchObject({
        rpID: 'example.com',
        rpName: 'Example',
        userName: 'jane@example.com',
        attestationType: 'none',
        authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
      })
      expect(call.excludeCredentials?.map(c => c.id)).toEqual(['cred-1'])
      // The handle is random bytes, never the database id
      expect(Buffer.from(call.userID!).toString()).not.toBe(String(user.id))
    })

    it('saves the passkey after a verified response', async () => {
      const { challenge } = await beginPasskeyRegistration(options, user)
      vi.mocked(webauthn.verifyRegistrationResponse).mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: { id: 'new-cred', publicKey: new Uint8Array([1, 2, 3]), counter: 0, transports: ['internal'] },
          credentialDeviceType: 'multiDevice',
          credentialBackedUp: true,
        },
      } as never)

      const passkey = await finishPasskeyRegistration(options, user, registrationResponse(challenge), 'Work phone')

      expect(passkey).toMatchObject({ user_id: user.id, credential_id: 'new-cred', name: 'Work phone', device_type: 'multiDevice' })
      expect(passkey.public_key).toBe(Buffer.from([1, 2, 3]).toString('base64url'))
      expect(await listPasskeys(options, user.id)).toHaveLength(1)
    })

    // Issue #224: the first passkey was saved with a handle other than the one the authenticator got
    it('saves a user first passkey with the handle sent to the authenticator, so it can log in', async () => {
      const { challenge } = await beginPasskeyRegistration(options, user)
      const sentHandle = Buffer.from(vi.mocked(webauthn.generateRegistrationOptions).mock.calls[0]![0].userID!).toString('base64url')
      verifiedRegistration('first-cred')

      const passkey = await finishPasskeyRegistration(options, user, registrationResponse(challenge, 'first-cred'))
      expect(passkey.user_handle).toBe(sentHandle)

      const login = await beginPasskeyLogin(options)
      verifiedLogin(1)
      const response = authenticationResponse(login.challenge, 'first-cred')
      await expect(finishPasskeyLogin(options, { ...response, response: { ...response.response, userHandle: sentHandle } })).resolves.toMatchObject({ id: user.id })
    })

    it('gives a user later passkeys the handle of their first one', async () => {
      const first = await beginPasskeyRegistration(options, user)
      verifiedRegistration('first-cred')
      const firstPasskey = await finishPasskeyRegistration(options, user, registrationResponse(first.challenge, 'first-cred'))

      const second = await beginPasskeyRegistration(options, user)
      const sentHandle = Buffer.from(vi.mocked(webauthn.generateRegistrationOptions).mock.calls[1]![0].userID!).toString('base64url')
      verifiedRegistration('second-cred')
      const secondPasskey = await finishPasskeyRegistration(options, user, registrationResponse(second.challenge, 'second-cred'))

      expect(sentHandle).toBe(firstPasskey.user_handle)
      expect(secondPasskey.user_handle).toBe(firstPasskey.user_handle)
    })

    it('saves both of two concurrent first registrations with one handle', async () => {
      const a = await beginPasskeyRegistration(options, user)
      const b = await beginPasskeyRegistration(options, user)
      verifiedRegistration('cred-a')
      await finishPasskeyRegistration(options, user, registrationResponse(a.challenge, 'cred-a'))
      verifiedRegistration('cred-b')
      await finishPasskeyRegistration(options, user, registrationResponse(b.challenge, 'cred-b'))

      const passkeys = await listPasskeys(options, user.id)
      expect(passkeys.map(p => p.credential_id)).toEqual(['cred-a', 'cred-b'])
      expect(new Set(passkeys.map(p => p.user_handle)).size).toBe(1)
    })

    // Issue #235: a new handle made the device keep the removed passkey next to the new one
    it('keeps the user handle after all of the user passkeys are deleted', async () => {
      const first = await beginPasskeyRegistration(options, user)
      verifiedRegistration('old-cred')
      const oldPasskey = await finishPasskeyRegistration(options, user, registrationResponse(first.challenge, 'old-cred'))
      await deletePasskey(options, user.id, oldPasskey.id)

      const again = await beginPasskeyRegistration(options, user)
      const sentHandle = Buffer.from(vi.mocked(webauthn.generateRegistrationOptions).mock.calls[1]![0].userID!).toString('base64url')
      verifiedRegistration('new-cred')
      const newPasskey = await finishPasskeyRegistration(options, user, registrationResponse(again.challenge, 'new-cred'))

      expect(sentHandle).toBe(oldPasskey.user_handle)
      expect(newPasskey.user_handle).toBe(oldPasskey.user_handle)
    })

    it('lets a user keep several passkeys, e.g. a laptop and a phone, and log in with each', async () => {
      for (const credentialId of ['laptop-cred', 'phone-cred']) {
        const { challenge } = await beginPasskeyRegistration(options, user)
        verifiedRegistration(credentialId)
        await finishPasskeyRegistration(options, user, registrationResponse(challenge, credentialId))
      }

      for (const [i, credentialId] of ['laptop-cred', 'phone-cred'].entries()) {
        const { challenge } = await beginPasskeyLogin(options)
        verifiedLogin(i + 1)
        await expect(finishPasskeyLogin(options, authenticationResponse(challenge, credentialId))).resolves.toMatchObject({ id: user.id })
      }
    })

    it('rejects a registration challenge stored without a user handle', async () => {
      await saveChallenge(options, { challenge: 'no-handle', type: 'registration', userId: user.id })

      await expect(finishPasskeyRegistration(options, user, registrationResponse('no-handle'))).rejects.toMatchObject({ statusCode: 400 })
      expect(webauthn.verifyRegistrationResponse).not.toHaveBeenCalled()
    })

    it('answers 409 when the credential is already registered, even on another account', async () => {
      const other = await createUser({ email: 'other@example.com', name: 'Other', password: 'Password123!' }, options) as User
      await storePasskeyFor(other.id, 0, 'new-cred')
      const { challenge } = await beginPasskeyRegistration(options, user)
      vi.mocked(webauthn.verifyRegistrationResponse).mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: { id: 'new-cred', publicKey: new Uint8Array([1]), counter: 0 },
          credentialDeviceType: 'multiDevice',
          credentialBackedUp: true,
        },
      } as never)

      await expect(finishPasskeyRegistration(options, user, registrationResponse(challenge))).rejects.toMatchObject({ statusCode: 409 })
      expect(await listPasskeys(options, user.id)).toHaveLength(0)
    })

    it('rejects a challenge that was issued to another user', async () => {
      await saveChallenge(options, { challenge: 'other-users', type: 'registration', userId: user.id + 1 })

      await expect(finishPasskeyRegistration(options, user, registrationResponse('other-users'))).rejects.toMatchObject({ statusCode: 400 })
      expect(webauthn.verifyRegistrationResponse).not.toHaveBeenCalled()
    })

    it('rejects a challenge that was already used', async () => {
      const { challenge } = await beginPasskeyRegistration(options, user)
      vi.mocked(webauthn.verifyRegistrationResponse).mockResolvedValue({ verified: false } as never)

      await expect(finishPasskeyRegistration(options, user, registrationResponse(challenge))).rejects.toBeInstanceOf(PasskeyError)
      await expect(finishPasskeyRegistration(options, user, registrationResponse(challenge))).rejects.toMatchObject({ statusCode: 400 })
      expect(webauthn.verifyRegistrationResponse).toHaveBeenCalledTimes(1)
    })

    it('does not save anything when verification fails', async () => {
      const { challenge } = await beginPasskeyRegistration(options, user)
      vi.mocked(webauthn.verifyRegistrationResponse).mockRejectedValue(new Error('bad attestation'))

      await expect(finishPasskeyRegistration(options, user, registrationResponse(challenge))).rejects.toMatchObject({ statusCode: 400 })
      expect(await listPasskeys(options, user.id)).toHaveLength(0)
    })
  })

  describe('login', () => {
    it('is usernameless: no credentials are allow-listed', async () => {
      await beginPasskeyLogin(options)

      const call = vi.mocked(webauthn.generateAuthenticationOptions).mock.calls[0]![0]
      expect(call).toMatchObject({ rpID: 'example.com', userVerification: 'preferred' })
      expect(call.allowCredentials).toBeUndefined()
    })

    it('returns the user and bumps the counter on success', async () => {
      await storePasskeyFor(user.id, 5)
      const { challenge } = await beginPasskeyLogin(options)
      verifiedLogin(6)

      const loggedIn = await finishPasskeyLogin(options, authenticationResponse(challenge))

      expect(loggedIn.id).toBe(user.id)
      expect((await findPasskeyByCredentialId(options, 'cred-1'))?.counter).toBe(6)
    })

    it('rejects an unknown credential and names it, so the browser can forget it', async () => {
      const { challenge } = await beginPasskeyLogin(options)

      await expect(finishPasskeyLogin(options, authenticationResponse(challenge, 'nope'))).rejects.toMatchObject({
        statusCode: 401,
        message: 'Unknown passkey',
        data: { code: 'unknown_credential', rpId: 'example.com', credentialId: 'nope' },
      })
    })

    it('does not name the credential when the challenge is not valid', async () => {
      await expect(finishPasskeyLogin(options, authenticationResponse('never-issued', 'nope'))).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid passkey',
        data: undefined,
      })
    })

    it('rejects a response whose user handle does not match the passkey owner', async () => {
      await storePasskeyFor(user.id)
      const { challenge } = await beginPasskeyLogin(options)
      verifiedLogin(1)
      const response = authenticationResponse(challenge)

      await expect(finishPasskeyLogin(options, { ...response, response: { ...response.response, userHandle: 'someone-else' } })).rejects.toMatchObject({ statusCode: 401 })
    })

    it('accepts a response carrying the matching user handle', async () => {
      await storePasskeyFor(user.id)
      const { challenge } = await beginPasskeyLogin(options)
      verifiedLogin(1)
      const response = authenticationResponse(challenge)

      await expect(finishPasskeyLogin(options, { ...response, response: { ...response.response, userHandle: 'handle-1' } })).resolves.toMatchObject({ id: user.id })
    })

    // Whether an inactive user may log in is decided by startSession, as for every login method
    it('reports an inactive user as inactive', async () => {
      await storePasskeyFor(user.id)
      await db.sql`UPDATE {${options.tables.users}} SET active = ${dbType === 'sqlite' ? 0 : false} WHERE id = ${user.id}`
      const { challenge } = await beginPasskeyLogin(options)
      verifiedLogin(1)

      await expect(finishPasskeyLogin(options, authenticationResponse(challenge))).resolves.toMatchObject({ id: user.id, active: expect.toBeOneOf([false, 0]) })
    })

    it('rejects a replayed challenge', async () => {
      await storePasskeyFor(user.id)
      const { challenge } = await beginPasskeyLogin(options)
      verifiedLogin(1)

      await finishPasskeyLogin(options, authenticationResponse(challenge))
      await expect(finishPasskeyLogin(options, authenticationResponse(challenge))).rejects.toMatchObject({ statusCode: 401 })
    })

    it('rejects an expired challenge', async () => {
      await storePasskeyFor(user.id)
      await saveChallenge(options, { challenge: 'old', type: 'authentication', ttlSeconds: -1 })
      verifiedLogin(1)

      await expect(finishPasskeyLogin(options, authenticationResponse('old'))).rejects.toMatchObject({ statusCode: 401 })
    })

    it('rejects a failed signature check', async () => {
      await storePasskeyFor(user.id)
      const { challenge } = await beginPasskeyLogin(options)
      vi.mocked(webauthn.verifyAuthenticationResponse).mockRejectedValue(new Error('bad signature'))

      await expect(finishPasskeyLogin(options, authenticationResponse(challenge))).rejects.toMatchObject({ statusCode: 401 })
    })

    it('rejects a counter that went backwards, which hints at a cloned credential', async () => {
      await storePasskeyFor(user.id, 10)
      const { challenge } = await beginPasskeyLogin(options)
      verifiedLogin(4)
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await expect(finishPasskeyLogin(options, authenticationResponse(challenge))).rejects.toMatchObject({ statusCode: 401 })
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Nuxt Users]'), expect.anything())
      expect((await findPasskeyByCredentialId(options, 'cred-1'))?.counter).toBe(10)
      warn.mockRestore()
    })

    it('lets only one of two concurrent logins with the same counter through', async () => {
      await storePasskeyFor(user.id, 5)
      const first = await beginPasskeyLogin(options)
      const second = await beginPasskeyLogin(options)
      verifiedLogin(6)

      const results = await Promise.allSettled([
        finishPasskeyLogin(options, authenticationResponse(first.challenge)),
        finishPasskeyLogin(options, authenticationResponse(second.challenge)),
      ])

      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
      expect((await findPasskeyByCredentialId(options, 'cred-1'))?.counter).toBe(6)
    })

    it('accepts authenticators that always report a counter of 0', async () => {
      await storePasskeyFor(user.id, 0)
      const { challenge } = await beginPasskeyLogin(options)
      verifiedLogin(0)

      await expect(finishPasskeyLogin(options, authenticationResponse(challenge))).resolves.toMatchObject({ id: user.id })
    })
  })
  describe('accepted credentials', () => {
    it('lists every passkey the user still has, under the handle the authenticators hold', async () => {
      const ids: number[] = []
      for (const credentialId of ['laptop-cred', 'phone-cred', 'tablet-cred']) {
        const { challenge } = await beginPasskeyRegistration(options, user)
        verifiedRegistration(credentialId)
        ids.push((await finishPasskeyRegistration(options, user, registrationResponse(challenge, credentialId))).id)
      }
      const handle = (await listPasskeys(options, user.id))[0]!.user_handle
      await deletePasskey(options, user.id, ids[1]!)

      expect(await getAcceptedPasskeyCredentials(options, user.id)).toEqual({
        rpId: 'example.com',
        userId: handle,
        allAcceptedCredentialIds: ['laptop-cred', 'tablet-cred'],
      })
    })

    it('keeps the handle with an empty list after the last passkey is deleted', async () => {
      const { challenge } = await beginPasskeyRegistration(options, user)
      verifiedRegistration('only-cred')
      const passkey = await finishPasskeyRegistration(options, user, registrationResponse(challenge, 'only-cred'))
      await deletePasskey(options, user.id, passkey.id)

      expect(await getAcceptedPasskeyCredentials(options, user.id)).toEqual({
        rpId: 'example.com',
        userId: passkey.user_handle,
        allAcceptedCredentialIds: [],
      })
    })

    it('is null for a user who never registered a passkey', async () => {
      expect(await getAcceptedPasskeyCredentials(options, user.id)).toBeNull()
    })
  })
})
