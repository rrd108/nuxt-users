import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Database } from 'db0'

import * as webauthn from '@simplewebauthn/server'
import { runMigrations } from '../src/runtime/server/utils/migrate'
import { createUser } from '../src/runtime/server/utils/user'
import { addPasskey, findPasskeyByCredentialId, listPasskeys, saveChallenge } from '../src/runtime/server/utils/passkey'
import {
  PasskeyError,
  resolvePasskeyConfig,
  beginPasskeyRegistration,
  finishPasskeyRegistration,
  beginPasskeyLogin,
  finishPasskeyLogin,
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

    it('rejects an unknown credential', async () => {
      const { challenge } = await beginPasskeyLogin(options)

      await expect(finishPasskeyLogin(options, authenticationResponse(challenge, 'nope'))).rejects.toMatchObject({ statusCode: 401 })
    })

    it('rejects an inactive user', async () => {
      await storePasskeyFor(user.id)
      await db.sql`UPDATE {${options.tables.users}} SET active = ${dbType === 'sqlite' ? 0 : false} WHERE id = ${user.id}`
      const { challenge } = await beginPasskeyLogin(options)
      verifiedLogin(1)

      await expect(finishPasskeyLogin(options, authenticationResponse(challenge))).rejects.toMatchObject({ statusCode: 403 })
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

    it('accepts authenticators that always report a counter of 0', async () => {
      await storePasskeyFor(user.id, 0)
      const { challenge } = await beginPasskeyLogin(options)
      verifiedLogin(0)

      await expect(finishPasskeyLogin(options, authenticationResponse(challenge))).resolves.toMatchObject({ id: user.id })
    })
  })
})
