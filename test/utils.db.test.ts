import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import { getConnector, checkTableExists } from '../src/utils/db'
import { createUsersTable } from '../src/utils/create-users-table'
import { cleanupTestSetup, createTestSetup } from './test-setup'
import type { DatabaseType, DatabaseConfig, ModuleOptions } from '../src/types'
import { hasAnyUsers } from '../src/utils/user'

describe('Utils: DB', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_utils_db',
      }
    }
    if (dbType === 'mysql') {
      dbConfig = {
        host: process.env.DB_HOST,
        port: Number.parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      }
    }
    if (dbType === 'postgresql') {
      dbConfig = {
        host: process.env.DB_HOST,
        port: Number.parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      }
    }

    const settings = await createTestSetup({
      dbType,
      dbConfig,
    })

    db = settings.db
    testOptions = settings.testOptions
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.passwordResetTokens)
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
      const exists = await checkTableExists(testOptions, 'users')
      expect(exists).toBe(false)
    })

    it('should return true when users table exists', async () => {
      // Create the users table first
      await createUsersTable(testOptions)

      const exists = await checkTableExists(testOptions, 'users')
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
        INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
        VALUES ('test@webmania.cc', 'Test User', 'hashedpassword', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      const hasUsers = await hasAnyUsers(testOptions)
      expect(hasUsers).toBe(true)
    })

    it('should return true with multiple users', async () => {
      // Create table and add multiple users
      await createUsersTable(testOptions)

      // Insert multiple test users
      await db.sql`
        INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
        VALUES ('user1@webmania.cc', 'User 1', 'pass1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      await db.sql`
        INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
        VALUES ('user2@webmania.cc', 'User 2', 'Gauranga-2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
      const tableExists = await checkTableExists(testOptions, 'users')
      expect(tableExists).toBe(false)

      // Step 2: Create table
      await createUsersTable(testOptions)

      // Step 3: Check table exists
      const tableExistsAfter = await checkTableExists(testOptions, 'users')
      expect(tableExistsAfter).toBe(true)

      // Step 4: Check no users exist
      const hasUsers = await hasAnyUsers(testOptions)
      expect(hasUsers).toBe(false)

      // Step 5: Add a user
      await db.sql`
        INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
        VALUES ('test@webmania.cc', 'Test User', 'hashedpassword', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      // Step 6: Check user exists
      const hasUsersAfter = await hasAnyUsers(testOptions)
      expect(hasUsersAfter).toBe(true)
    })

    it('should handle multiple database operations correctly', async () => {
      // Create table
      await createUsersTable(testOptions)

      // Verify table exists
      expect(await checkTableExists(testOptions, 'users')).toBe(true)

      // Verify no users initially
      expect(await hasAnyUsers(testOptions)).toBe(false)

      // Add users
      await db.sql`
        INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
        VALUES ('user1@webmania.cc', 'User 1', 'pass1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      await db.sql`
        INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
        VALUES ('user2@webmania.cc', 'User 2', 'Gauranga-2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      // Verify users exist
      expect(await hasAnyUsers(testOptions)).toBe(true)

      // Verify table still exists
      expect(await checkTableExists(testOptions, 'users')).toBe(true)
    })
  })
})
