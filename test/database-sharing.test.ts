import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Database } from 'db0'
import { createUsersTable } from '../src/runtime/server/utils/create-users-table'
import { cleanupTestSetup, createTestSetup } from './test-setup'
import type { DatabaseType, DatabaseConfig, ModuleOptions } from '../src/types'
import { useNuxtUsersDatabase } from '../src/runtime/server/composables/useNuxtUsersDatabase'

describe('Database Sharing Feature', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_database_sharing_test',
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
    // Clean up all test tables
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], 'consumer_table')
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], 'custom_posts')
  })

  describe('useNuxtUsersDatabase Composable', () => {
    it('should provide access to the module database', async () => {
      // Mock the runtime config to simulate Nuxt environment
      const mockUseRuntimeConfig = vi.fn().mockReturnValue({
        nuxtUsers: testOptions
      })

      // Mock the useDb function
      const mockUseDb = vi.fn().mockResolvedValue(db)

      // Mock the dynamic imports in useNuxtUsersDatabase
      vi.doMock('#imports', () => ({
        useRuntimeConfig: mockUseRuntimeConfig
      }))

      vi.doMock('../src/runtime/server/utils/db', () => ({
        useDb: mockUseDb
      }))

      // Test the composable
      const result = await useNuxtUsersDatabase()

      expect(result).toBeDefined()
      expect(result.database).toBeDefined()
      expect(result.options).toBeDefined()
      expect(result.options.tables).toEqual(testOptions.tables)
      expect(result.options.connector).toEqual(testOptions.connector)

      // Verify the mocks were called correctly
      expect(mockUseRuntimeConfig).toHaveBeenCalled()
      expect(mockUseDb).toHaveBeenCalledWith(testOptions)
    })
  })

  describe('Shared Database Operations', () => {
    it('should allow consumer to create custom tables in shared database', async () => {
      // First, create the module's users table
      await createUsersTable(testOptions)

      // Verify users table exists
      const usersTableExists = await db.sql`
        SELECT name FROM sqlite_master WHERE type='table' AND name=${testOptions.tables.users}
      `.catch(() => null)

      if (dbType === 'sqlite') {
        expect(usersTableExists?.rows).toBeDefined()
        expect(usersTableExists?.rows?.length).toBeGreaterThan(0)
      }

      // Consumer creates their own table in the same database
      if (dbType === 'sqlite') {
        await db.sql`
          CREATE TABLE IF NOT EXISTS consumer_table (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
      else if (dbType === 'mysql') {
        await db.sql`
          CREATE TABLE IF NOT EXISTS consumer_table (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
      else if (dbType === 'postgresql') {
        await db.sql`
          CREATE TABLE IF NOT EXISTS consumer_table (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }

      // Verify consumer table was created successfully
      const consumerTableExists = await db.sql`SELECT 1 FROM consumer_table LIMIT 1`.catch(() => null)
      expect(consumerTableExists).not.toBe(null)
    })

    it('should allow data operations across module and consumer tables', async () => {
      // Create module's users table
      await createUsersTable(testOptions)

      // Create consumer's posts table
      if (dbType === 'sqlite') {
        await db.sql`
          CREATE TABLE IF NOT EXISTS custom_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
      else if (dbType === 'mysql') {
        await db.sql`
          CREATE TABLE IF NOT EXISTS custom_posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
      else if (dbType === 'postgresql') {
        await db.sql`
          CREATE TABLE IF NOT EXISTS custom_posts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }

      // Insert test user (module's table)
      await db.sql`
        INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
        VALUES ('testuser@example.com', 'Test User', 'hashed_password', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      // Get the user ID
      const userResult = await db.sql`SELECT id FROM {${testOptions.tables.users}} WHERE email = 'testuser@example.com'`
      expect(userResult.rows).toBeDefined()
      expect(userResult.rows?.length).toBe(1)
      const userId = userResult.rows?.[0]?.id

      // Insert post linked to user (consumer's table)
      await db.sql`
        INSERT INTO custom_posts (user_id, title, content)
        VALUES (${userId}, 'My First Post', 'This is a test post content')
      `

      // Verify data relationship works
      let joinQuery
      if (dbType === 'sqlite') {
        joinQuery = await db.sql`
          SELECT u.name, u.email, p.title, p.content
          FROM {${testOptions.tables.users}} u
          JOIN custom_posts p ON u.id = p.user_id
          WHERE u.email = 'testuser@example.com'
        `
      }
      else {
        joinQuery = await db.sql`
          SELECT u.name, u.email, p.title, p.content
          FROM {${testOptions.tables.users}} u
          JOIN custom_posts p ON u.id = p.user_id
          WHERE u.email = 'testuser@example.com'
        `
      }

      expect(joinQuery.rows).toBeDefined()
      expect(joinQuery.rows?.length).toBe(1)
      expect(joinQuery.rows?.[0]?.name).toBe('Test User')
      expect(joinQuery.rows?.[0]?.title).toBe('My First Post')
    })

    it('should handle multiple consumer tables in shared database', async () => {
      // Create multiple consumer tables
      const tables = ['consumer_posts', 'consumer_comments', 'consumer_categories']

      for (const tableName of tables) {
        if (dbType === 'sqlite') {
          await db.sql`
            CREATE TABLE IF NOT EXISTS {${tableName}} (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `
        }
        else if (dbType === 'mysql') {
          await db.sql`
            CREATE TABLE IF NOT EXISTS {${tableName}} (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        }
        else if (dbType === 'postgresql') {
          await db.sql`
            CREATE TABLE IF NOT EXISTS {${tableName}} (
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `
        }

        // Insert test data
        await db.sql`INSERT INTO {${tableName}} (name) VALUES (${`Test ${tableName}`})`
      }

      // Verify all tables were created and contain data
      for (const tableName of tables) {
        const result = await db.sql`SELECT COUNT(*) as count FROM {${tableName}}`
        expect(Number(result.rows?.[0]?.count)).toBeGreaterThan(0)
      }

      // Clean up the additional tables
      for (const tableName of tables) {
        await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], tableName)
      }
    })
  })

  describe('Database Configuration Scenarios', () => {
    it('should work with different SQLite paths', async () => {
      if (dbType !== 'sqlite') {
        return // Skip for non-SQLite databases
      }

      // Test with custom SQLite path
      const customConfig = {
        ...testOptions,
        connector: {
          name: 'sqlite' as DatabaseType,
          options: {
            path: './_custom_shared_db'
          }
        }
      }

      // Create database with custom config
      const customSetup = await createTestSetup({
        dbType: 'sqlite',
        dbConfig: customConfig.connector.options
      })

      // Create a test table
      await customSetup.db.sql`
        CREATE TABLE IF NOT EXISTS custom_test (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message TEXT NOT NULL
        )
      `

      await customSetup.db.sql`INSERT INTO custom_test (message) VALUES ('Custom database works!')`

      const result = await customSetup.db.sql`SELECT message FROM custom_test`
      expect(result.rows?.[0]?.message).toBe('Custom database works!')

      // Clean up
      await cleanupTestSetup('sqlite', customSetup.db, [customConfig.connector.options.path!], 'custom_test')
    })

    it('should maintain data isolation between tests', async () => {
      // This test verifies that each test gets a clean database state

      // Create users table and add data
      await createUsersTable(testOptions)
      await db.sql`
        INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
        VALUES ('isolation_test@example.com', 'Isolation Test', 'password', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      const userResult = await db.sql`SELECT COUNT(*) as count FROM {${testOptions.tables.users}}`
      expect(Number(userResult.rows?.[0]?.count)).toBe(1)

      // The afterEach hook should clean this up automatically
      // Next test should start with a clean database
    })
  })

  describe('Database Type Compatibility', () => {
    it(`should work correctly with ${dbType} database`, async () => {
      // Create a test table appropriate for the database type
      if (dbType === 'sqlite') {
        await db.sql`
          CREATE TABLE IF NOT EXISTS type_test (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
      else if (dbType === 'mysql') {
        await db.sql`
          CREATE TABLE IF NOT EXISTS type_test (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
      else if (dbType === 'postgresql') {
        await db.sql`
          CREATE TABLE IF NOT EXISTS type_test (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }

      // Insert and retrieve data
      await db.sql`INSERT INTO type_test (name) VALUES (${`${dbType} test`})`
      const result = await db.sql`SELECT name FROM type_test WHERE name = ${`${dbType} test`}`

      expect(result.rows).toBeDefined()
      expect(result.rows?.length).toBe(1)
      expect(result.rows?.[0]?.name).toBe(`${dbType} test`)

      // Clean up
      await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], 'type_test')
    })
  })
})
