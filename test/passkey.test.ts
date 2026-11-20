import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import { runMigrations, getAppliedMigrations } from '../src/runtime/server/utils/migrate'
import { tableExists } from '../src/runtime/server/utils/schema'
import {
  saveChallenge,
  consumeChallenge,
  getOrCreateUserHandle,
  addPasskey,
  listPasskeys,
  findPasskeyByCredentialId,
  deletePasskey,
  updatePasskeyCounter,
  deleteExpiredPasskeyChallenges,
  deletePasskeysForUser,
} from '../src/runtime/server/utils/passkey'
import { cleanupTestSetup, createTestSetup, getDatabaseConfig } from './test-setup'
import type { DatabaseType, ModuleOptions } from '../src/types'

describe('Passkey store', () => {
  let db: Database
  let options: ModuleOptions
  let dbType: DatabaseType

  const newPasskey = (overrides: Partial<Parameters<typeof addPasskey>[1]> = {}) => ({
    userId: 1,
    credentialId: 'cred-1',
    publicKey: 'public-key-1',
    counter: 0,
    transports: ['internal', 'hybrid'],
    deviceType: 'multiDevice',
    backedUp: true,
    name: 'My laptop',
    userHandle: 'handle-1',
    ...overrides,
  })

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    const dbConfig = getDatabaseConfig(dbType)
    if (dbType === 'sqlite') {
      dbConfig.path = './_passkey_db'
    }
    const settings = await createTestSetup({ dbType, dbConfig })
    db = settings.db
    options = settings.testOptions as ModuleOptions
    // Start from a clean slate: other test files share the MySQL/PostgreSQL database and may leave tables behind
    if (dbType !== 'sqlite') {
      await dropAllTables()
    }
    await runMigrations(options)
  })

  const allTables = () => [options.tables.passkeys, options.tables.passkeyChallenges, options.tables.users, options.tables.personalAccessTokens, options.tables.passwordResetTokens, options.tables.migrations]

  const dropAllTables = async () => {
    for (const table of allTables()) {
      await cleanupTestSetup(dbType, db, [options.connector.options.path!], table)
    }
  }

  afterEach(dropAllTables)

  describe('migration', () => {
    it('creates both passkey tables and records the migration', async () => {
      expect(await tableExists(options, options.tables.passkeys)).toBe(true)
      expect(await tableExists(options, options.tables.passkeyChallenges)).toBe(true)
      expect(await getAppliedMigrations(options)).toContain('create_passkey_tables')
    })

    it('is a no-op when run again', async () => {
      expect(await runMigrations(options)).toEqual([])
    })
  })

  describe('passkeys', () => {
    it('stores a passkey and returns it for its user', async () => {
      await addPasskey(options, newPasskey())

      const passkeys = await listPasskeys(options, 1)
      expect(passkeys).toHaveLength(1)
      expect(passkeys[0]).toMatchObject({
        user_id: 1,
        credential_id: 'cred-1',
        public_key: 'public-key-1',
        counter: 0,
        name: 'My laptop',
        device_type: 'multiDevice',
        user_handle: 'handle-1',
      })
      expect(passkeys[0]!.transports).toEqual(['internal', 'hybrid'])
      expect(Boolean(passkeys[0]!.backed_up)).toBe(true)
    })

    it('does not list passkeys of other users', async () => {
      await addPasskey(options, newPasskey())
      await addPasskey(options, newPasskey({ userId: 2, credentialId: 'cred-2', userHandle: 'handle-2' }))

      const passkeys = await listPasskeys(options, 2)
      expect(passkeys.map(p => p.credential_id)).toEqual(['cred-2'])
    })

    it('rejects a duplicate credential id', async () => {
      await addPasskey(options, newPasskey())
      await expect(addPasskey(options, newPasskey({ userId: 2 }))).rejects.toThrow()
    })

    it('finds a passkey by credential id', async () => {
      await addPasskey(options, newPasskey())
      expect((await findPasskeyByCredentialId(options, 'cred-1'))?.user_id).toBe(1)
      expect(await findPasskeyByCredentialId(options, 'missing')).toBeNull()
    })

    it('updates the counter and last used time', async () => {
      const passkey = await addPasskey(options, newPasskey())
      expect(passkey.last_used_at).toBeNull()

      await updatePasskeyCounter(options, passkey.id, 7)

      const updated = await findPasskeyByCredentialId(options, 'cred-1')
      expect(updated?.counter).toBe(7)
      expect(updated?.last_used_at).not.toBeNull()
    })

    it('deletes a passkey only for its owner', async () => {
      const passkey = await addPasskey(options, newPasskey())

      expect(await deletePasskey(options, 2, passkey.id)).toBe(false)
      expect(await listPasskeys(options, 1)).toHaveLength(1)

      expect(await deletePasskey(options, 1, passkey.id)).toBe(true)
      expect(await listPasskeys(options, 1)).toHaveLength(0)
    })

    it('deletes all passkeys of a user', async () => {
      await addPasskey(options, newPasskey())
      await addPasskey(options, newPasskey({ credentialId: 'cred-1b' }))
      await addPasskey(options, newPasskey({ userId: 2, credentialId: 'cred-2' }))

      await deletePasskeysForUser(options, 1)

      expect(await listPasskeys(options, 1)).toHaveLength(0)
      expect(await listPasskeys(options, 2)).toHaveLength(1)
    })
  })

  describe('user handle', () => {
    it('generates a random handle for a user without passkeys', async () => {
      const first = await getOrCreateUserHandle(options, 1)
      const other = await getOrCreateUserHandle(options, 2)
      expect(first).toMatch(/^[\w-]{43}$/)
      expect(other).not.toBe(first)
    })

    it('reuses the handle of the user existing passkeys', async () => {
      await addPasskey(options, newPasskey({ userHandle: 'stored-handle' }))
      expect(await getOrCreateUserHandle(options, 1)).toBe('stored-handle')
    })
  })

  describe('challenges', () => {
    it('can be consumed once', async () => {
      await saveChallenge(options, { challenge: 'chal-1', type: 'registration', userId: 1 })

      expect(await consumeChallenge(options, 'chal-1', 'registration')).toEqual({ userId: 1 })
      expect(await consumeChallenge(options, 'chal-1', 'registration')).toBeNull()
    })

    it('is bound to its ceremony type', async () => {
      await saveChallenge(options, { challenge: 'chal-2', type: 'authentication' })

      expect(await consumeChallenge(options, 'chal-2', 'registration')).toBeNull()
    })

    it('stores authentication challenges without a user', async () => {
      await saveChallenge(options, { challenge: 'chal-3', type: 'authentication' })

      expect(await consumeChallenge(options, 'chal-3', 'authentication')).toEqual({ userId: null })
    })

    it('cannot be consumed after it expired', async () => {
      await saveChallenge(options, { challenge: 'chal-4', type: 'authentication', ttlSeconds: -1 })

      expect(await consumeChallenge(options, 'chal-4', 'authentication')).toBeNull()
    })

    it('removes only expired challenges on cleanup', async () => {
      await saveChallenge(options, { challenge: 'old', type: 'authentication', ttlSeconds: -1 })
      await saveChallenge(options, { challenge: 'fresh', type: 'authentication' })

      expect(await deleteExpiredPasskeyChallenges(options)).toBe(1)
      expect(await consumeChallenge(options, 'fresh', 'authentication')).toEqual({ userId: null })
    })
  })
})
