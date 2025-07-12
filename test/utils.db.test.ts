import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createDatabase } from 'db0'
import type { Database } from 'db0'
import { getConnector, checkUsersTableExists, hasAnyUsers } from '../src/runtime/server/utils/db'
import { createUsersTable } from '../src/runtime/server/utils/create-users-table'
import type { ModuleOptions } from '../src/types'
import fs from 'node:fs'
import { resolve } from 'pathe'
import { fileURLToPath } from 'node:url'

const dbPath = resolve(fileURLToPath(import.meta.url), '../fixtures/utils/db/_db-utils')
const dbPathDifferent = resolve(fileURLToPath(import.meta.url), '../fixtures/utils/db/_db-utils-different')
const dbPathHasUsers = resolve(fileURLToPath(import.meta.url), '../fixtures/utils/db/_db-utils-has-users')

describe('Utils: DB', () => {
  let db: Database
  let testOptions: ModuleOptions

  beforeEach(async () => {
    // Create unique database path for each test
    testOptions = {
      connector: {
        name: 'sqlite',
        options: {
          path: dbPath, // Specific in-memory database for this test
        },
      },
      tables: {
        users: 'users',
        personalAccessTokens: 'personal_access_tokens',
        passwordResetTokens: 'password_reset_tokens',
      },
    }

    // Create in-memory database
    const connector = await import('db0/connectors/better-sqlite3')
    db = createDatabase(connector.default(testOptions.connector!.options))
  })

  afterEach(async () => {
    try {
      fs.unlinkSync(dbPath)
    }
    catch {
      // Ignore errors during cleanup
    }
  })

  describe('getConnector', () => {
    it('should return sqlite connector', async () => {
      const connector = await getConnector('sqlite')
      expect(connector).toBeDefined()
      expect(typeof connector).toBe('function')
    })

    it.todo('should return mysql connector', async () => {
      const connector = await getConnector('mysql')
      expect(connector).toBeDefined()
      expect(typeof connector).toBe('function')
    })

    it.todo('should return postgresql connector', async () => {
      const connector = await getConnector('postgresql')
      expect(connector).toBeDefined()
      expect(typeof connector).toBe('function')
    })

    it('should throw error for unsupported connector', async () => {
      await expect(getConnector('unsupported')).rejects.toThrow('Unsupported database connector: unsupported')
    })
  })

  describe('checkUsersTableExists', () => {
    it('should return false when users table does not exist', async () => {
      const exists = await checkUsersTableExists(testOptions)
      expect(exists).toBe(false)
    })

    it('should return true when users table exists', async () => {
      // Create the users table first
      await createUsersTable(testOptions)

      const exists = await checkUsersTableExists(testOptions)
      expect(exists).toBe(true)
    })
  })

  describe('hasAnyUsers', () => {
    it('should return false when no users exist', async () => {
      // Create table but don't add users
      await createUsersTable(testOptions)

      const hasUsers = await hasAnyUsers(testOptions)
      expect(hasUsers).toBe(false)
    })

    it('should return true when users exist', async () => {
      // Create table and add a user
      await createUsersTable(testOptions)

      // Insert a test user
      await db.sql`
        INSERT INTO ${testOptions.tables.users} (email, name, password, created_at, updated_at)
        VALUES ('test@example.com', 'Test User', 'hashedpassword', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      const hasUsers = await hasAnyUsers(testOptions)
      expect(hasUsers).toBe(true)
    })

    it('should return true with multiple users', async () => {
      // Create table and add multiple users
      await createUsersTable(testOptions)

      // Insert multiple test users
      await db.sql`
        INSERT INTO ${testOptions.tables.users} (email, name, password, created_at, updated_at)
        VALUES ('user1@example.com', 'User 1', 'pass1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      await db.sql`
        INSERT INTO ${testOptions.tables.users} (email, name, password, created_at, updated_at)
        VALUES ('user2@example.com', 'User 2', 'pass2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      const hasUsers = await hasAnyUsers(testOptions)
      expect(hasUsers).toBe(true)
    })

    it('should handle table not existing gracefully', async () => {
      // Don't create the table
      const hasUsers = await hasAnyUsers(testOptions)
      expect(hasUsers).toBe(false)
    })
  })

  describe('Integration tests', () => {
    it('should work together: create table, check exists, add users, check has users', async () => {
      // Step 1: Check table doesn't exist
      const tableExists = await checkUsersTableExists(testOptions)
      expect(tableExists).toBe(false)

      // Step 2: Create table
      await createUsersTable(testOptions)

      // Step 3: Check table exists
      const tableExistsAfter = await checkUsersTableExists(testOptions)
      expect(tableExistsAfter).toBe(true)

      // Step 4: Check no users exist
      const hasUsers = await hasAnyUsers(testOptions)
      expect(hasUsers).toBe(false)

      // Step 5: Add a user
      await db.sql`
        INSERT INTO ${testOptions.tables.users} (email, name, password, created_at, updated_at)
        VALUES ('test@example.com', 'Test User', 'hashedpassword', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      // Step 6: Check user exists
      const hasUsersAfter = await hasAnyUsers(testOptions)
      expect(hasUsersAfter).toBe(true)
    })

    it('should handle multiple database operations correctly', async () => {
      // Create table
      await createUsersTable(testOptions)

      // Verify table exists
      expect(await checkUsersTableExists(testOptions)).toBe(true)

      // Verify no users initially
      expect(await hasAnyUsers(testOptions)).toBe(false)

      // Add users
      await db.sql`
        INSERT INTO ${testOptions.tables.users} (email, name, password, created_at, updated_at)
        VALUES ('user1@example.com', 'User 1', 'pass1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      await db.sql`
        INSERT INTO ${testOptions.tables.users} (email, name, password, created_at, updated_at)
        VALUES ('user2@example.com', 'User 2', 'pass2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      // Verify users exist
      expect(await hasAnyUsers(testOptions)).toBe(true)

      // Verify table still exists
      expect(await checkUsersTableExists(testOptions)).toBe(true)
    })
  })
})
