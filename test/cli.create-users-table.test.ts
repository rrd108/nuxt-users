import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createDatabase } from 'db0'
import { createUsersTable } from '../src/runtime/server/utils/create-users-table'
import type { ModuleOptions } from '../src/types'
import fs from 'fs'

describe('CLI: Create Users Table', () => {
  let db: any
  let testOptions: ModuleOptions

  beforeEach(async () => {
    // Create unique database path for each test
    testOptions = {
      connector: {
        name: 'sqlite',
        options: {
          path: './_create-users-table', // Specific in-memory database for this test
        },
      },
    }

    // Create in-memory database
    const connector = await import('db0/connectors/better-sqlite3')
    db = createDatabase(connector.default(testOptions.connector!.options))
  })

  afterEach(async () => {
    // Clean up - drop the table
    try {
      fs.unlinkSync('./_create-users-table')
      fs.unlinkSync('./_create-users-table-different-connector')
    } catch (error) {
      // Ignore errors during cleanup
    }
  })

  it('should create users table successfully', async () => {
    await createUsersTable('users', testOptions)

    // Verify table exists by querying it
    const result = await db.sql`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`
    const table = result.rows?.[0]

    expect(table).toBeDefined()
    expect(table.name).toBe('users')
  })

  it('should create table with correct schema', async () => {
    await createUsersTable('users', testOptions)

    // Test that we can insert and query data (this validates the schema works)
    await db.sql`
      INSERT INTO users (email, name, password)
      VALUES ('test@example.com', 'Test User', 'hashedpassword')
    `

    const result = await db.sql`SELECT id, email, name, password, created_at, updated_at FROM users WHERE email = 'test@example.com'`
    const user = result.rows?.[0]

    // Check all required fields exist and have correct types
    expect(user).toBeDefined()
    expect(user.id).toBe(1) // Auto-increment works
    expect(user.email).toBe('test@example.com')
    expect(user.name).toBe('Test User')
    expect(user.password).toBe('hashedpassword')
    expect(user.created_at).toBeDefined()
    expect(user.updated_at).toBeDefined()

    // Test that email is unique
    await expect(db.sql`
      INSERT INTO users (email, name, password)
      VALUES ('test@example.com', 'Another User', 'anotherpassword')
    `).rejects.toThrow()
  })

  it('should handle CREATE TABLE IF NOT EXISTS correctly', async () => {
    // Create table first time
    await createUsersTable('users', testOptions)

    // Try to create table again (should not fail)
    await expect(createUsersTable('users', testOptions)).resolves.not.toThrow()

    // Verify table still exists and works
    const result = await db.sql`SELECT COUNT(*) as count FROM users`
    expect(result.rows?.[0]?.count).toBe(0)
  })

  it('should enforce unique constraint on email', async () => {
    await createUsersTable('users', testOptions)

    // Insert first user
    await db.sql`
      INSERT INTO users (email, name, password, created_at, updated_at)
      VALUES ('test@example.com', 'Test User', 'hashedpassword', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    // Try to insert user with same email (should fail)
    await expect(db.sql`
      INSERT INTO users (email, name, password, created_at, updated_at)
      VALUES ('test@example.com', 'Another User', 'hashedpassword', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).rejects.toThrow()
  })

  it('should auto-increment ID correctly', async () => {
    await createUsersTable('users', testOptions)

    // Insert multiple users
    await db.sql`
      INSERT INTO users (email, name, password, created_at, updated_at)
      VALUES ('user1@example.com', 'User 1', 'pass1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    await db.sql`
      INSERT INTO users (email, name, password, created_at, updated_at)
      VALUES ('user2@example.com', 'User 2', 'pass2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    // Check IDs are auto-incremented
    const result = await db.sql`SELECT id, email FROM users ORDER BY id`
    const users = result.rows || []

    expect(users).toHaveLength(2)
    expect(users[0].id).toBe(1)
    expect(users[1].id).toBe(2)
  })

  it('should set default timestamps', async () => {
    await createUsersTable('users', testOptions)

    // Insert user without specifying timestamps
    await db.sql`
      INSERT INTO users (email, name, password)
      VALUES ('test@example.com', 'Test User', 'hashedpassword')
    `

    // Check that timestamps were set
    const result = await db.sql`SELECT created_at, updated_at FROM users WHERE email = 'test@example.com'`
    const user = result.rows?.[0]

    expect(user.created_at).toBeDefined()
    expect(user.updated_at).toBeDefined()
    expect(user.created_at).not.toBeNull()
    expect(user.updated_at).not.toBeNull()
  })

  it('should throw error for unknown table', async () => {
    await expect(createUsersTable('unknown_table', testOptions)).rejects.toThrow('Unknown table: unknown_table')
  })

  it('should work with different database connectors', async () => {
    // Test with different connector options (still using SQLite but different path)
    const differentOptions: ModuleOptions = {
      connector: {
        name: 'sqlite',
        options: {
          path: './_create-users-table-different-connector', // Different in-memory instance
        },
      },
    }

    await expect(createUsersTable('users', differentOptions)).resolves.not.toThrow()
  })

  it('should handle table creation with all constraints', async () => {
    await createUsersTable('users', testOptions)

    // Test inserting a valid user
    await expect(db.sql`
      INSERT INTO users (email, name, password)
      VALUES ('valid@example.com', 'Valid User', 'validpassword')
    `).resolves.not.toThrow()

    // Test that required fields are enforced
    await expect(db.sql`
      INSERT INTO users (email, name)
      VALUES ('invalid@example.com', 'Invalid User')
    `).rejects.toThrow() // Missing password

    await expect(db.sql`
      INSERT INTO users (email, password)
      VALUES ('invalid2@example.com', 'password')
    `).rejects.toThrow() // Missing name

    await expect(db.sql`
      INSERT INTO users (name, password)
      VALUES ('Invalid User', 'password')
    `).rejects.toThrow() // Missing email
  })
}) 