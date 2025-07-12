import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import { createUsersTable } from '../src/runtime/server/utils/create-users-table'
import type { DatabaseConfig, DatabaseType, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './utils/test-setup'

describe('CLI: Create Users Table', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_create-users-table',
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
    const settings = await createTestSetup({
      dbType,
      dbConfig,
    })

    db = settings.db
    testOptions = settings.testOptions
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
  })

  it('should create users table successfully', async () => {
    await createUsersTable(testOptions)

    // Verify table exists by querying it
    const result = await db.sql`SELECT 1 FROM {${testOptions.tables.users}} LIMIT 1`
    expect(result).toBeDefined()
  })

  it('should create table with correct schema', async () => {
    await createUsersTable(testOptions)

    // Test that we can insert and query data (this validates the schema works)
    await db.sql`
      INSERT INTO {${testOptions.tables.users}} (email, name, password)
      VALUES ('test@webmania.cc', 'Test User', 'hashedpassword')
    `

    const result = await db.sql`SELECT id, email, name, password, created_at, updated_at FROM {${testOptions.tables.users}} WHERE email = 'test@webmania.cc'`
    const user = result.rows?.[0]

    // Check all required fields exist and have correct types
    expect(user).toBeDefined()
    expect(user?.id).toBe(1) // Auto-increment works
    expect(user?.email).toBe('test@webmania.cc')
    expect(user?.name).toBe('Test User')
    expect(user?.password).toBe('hashedpassword')
    expect(user?.created_at).toBeDefined()
    expect(user?.updated_at).toBeDefined()

    // Test that email is unique
    await expect(db.sql`
      INSERT INTO {${testOptions.tables.users}} (email, name, password)
      VALUES ('test@webmania.cc', 'Another User', 'anotherpassword')
    `).rejects.toThrow()
  })

  it('should handle CREATE TABLE IF NOT EXISTS correctly', async () => {
    // Create table first time
    await createUsersTable(testOptions)

    // Try to create table again (should not fail)
    await expect(createUsersTable(testOptions)).resolves.not.toThrow()

    // Verify table still exists and works
    const result = await db.sql`SELECT COUNT(*) as count FROM {${testOptions.tables.users}}`
    expect(result.rows?.[0]?.count).toBe(0)
  })

  it('should enforce unique constraint on email', async () => {
    await createUsersTable(testOptions)

    // Insert first user
    await db.sql`
      INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
      VALUES ('test@webmania.cc', 'Test User', 'hashedpassword', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    // Try to insert user with same email (should fail)
    await expect(db.sql`
      INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
      VALUES ('test@webmania.cc', 'Another User', 'hashedpassword', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).rejects.toThrow()
  })

  it('should auto-increment ID correctly', async () => {
    await createUsersTable(testOptions)

    // Insert multiple users
    await db.sql`
      INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
      VALUES ('user1@webmania.cc', 'User 1', 'pass1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    await db.sql`
      INSERT INTO {${testOptions.tables.users}} (email, name, password, created_at, updated_at)
      VALUES ('user2@webmania.cc', 'User 2', 'pass2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    // Check IDs are auto-incremented
    const result = await db.sql`SELECT id, email FROM {${testOptions.tables.users}} ORDER BY id`
    const users = result.rows || []

    expect(users).toHaveLength(2)
    expect(users[0].id).toBe(1)
    expect(users[1].id).toBe(2)
  })

  it('should set default timestamps', async () => {
    await createUsersTable(testOptions)

    // Insert user without specifying timestamps
    await db.sql`
      INSERT INTO {${testOptions.tables.users}} (email, name, password)
      VALUES ('test@webmania.cc', 'Test User', 'hashedpassword')
    `

    // Check that timestamps were set
    const result = await db.sql`SELECT created_at, updated_at FROM {${testOptions.tables.users}} WHERE email = 'test@webmania.cc'`
    const user = result.rows?.[0]

    expect(user.created_at).toBeDefined()
    expect(user.updated_at).toBeDefined()
    expect(user.created_at).not.toBeNull()
    expect(user.updated_at).not.toBeNull()
  })

  it('should handle table creation with all constraints', async () => {
    await createUsersTable(testOptions)

    // Test inserting a valid user
    await expect(db.sql`
      INSERT INTO {${testOptions.tables.users}} (email, name, password)
      VALUES ('valid@webmania.cc', 'Valid User', 'validpassword')
    `).resolves.not.toThrow()

    // Test that required fields are enforced
    await expect(db.sql`
      INSERT INTO {${testOptions.tables.users}} (email, name)
      VALUES ('invalid@webmania.cc', 'Invalid User')
    `).rejects.toThrow() // Missing password

    await expect(db.sql`
      INSERT INTO {${testOptions.tables.users}} (email, password)
      VALUES ('invalid2@webmania.cc', 'password')
    `).rejects.toThrow() // Missing name

    await expect(db.sql`
      INSERT INTO {${testOptions.tables.users}} (name, password)
      VALUES ('Invalid User', 'password')
    `).rejects.toThrow() // Missing email
  })
})
