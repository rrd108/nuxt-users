import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import { createUsersTable } from '../src/utils/create-users-table'
import { createUser } from '../src/utils/user'
import type { DatabaseConfig, DatabaseType, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './test-setup'

describe('CLI: Create User', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_create-user',
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

    await createUsersTable(testOptions)
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
  })

  it('should create a user successfully', async () => {
    const userData = {
      email: 'test@webmania.cc',
      name: 'Test User',
      password: 'mypassword123'
    }

    await createUser(userData, testOptions)

    // Verify user was created
    const result = await db.sql`SELECT id, email, name, created_at FROM users WHERE email = ${userData.email}`
    const user = result.rows?.[0]

    expect(user).toBeDefined()
    expect(user?.email).toBe(userData.email)
    expect(user?.name).toBe(userData.name)
    expect(user?.id).toBe(1)
    expect(user?.created_at).toBeDefined()
  })

  it('should hash the password correctly', async () => {
    const userData = {
      email: 'test@webmania.cc',
      name: 'Test User',
      password: 'mypassword123'
    }

    await createUser(userData, testOptions)

    // Get the stored password
    const result = await db.sql`SELECT password FROM users WHERE email = ${userData.email}`
    const storedPassword = result.rows?.[0]?.password as string

    expect(storedPassword).toBeDefined()
    expect(storedPassword).not.toBe(userData.password) // Should be hashed
    expect(storedPassword.length).toBeGreaterThan(20) // bcrypt hash is long
  })

  it('should create multiple users with different IDs', async () => {
    const users = [
      { email: 'user1@webmania.cc', name: 'User 1', password: 'pass1' },
      { email: 'user2@webmania.cc', name: 'User 2', password: 'pass2' },
      { email: 'user3@webmania.cc', name: 'User 3', password: 'pass3' }
    ]

    for (const userData of users) {
      await createUser(userData, testOptions)
    }

    // Verify all users were created with different IDs
    const result = await db.sql`SELECT id, email FROM users ORDER BY id`
    const createdUsers = result.rows || []

    expect(createdUsers).toHaveLength(3)
    expect(createdUsers[0].id).toBe(1)
    expect(createdUsers[1].id).toBe(2)
    expect(createdUsers[2].id).toBe(3)
  })

  it('should set created_at and updated_at timestamps', async () => {
    const userData = {
      email: 'test@webmania.cc',
      name: 'Test User',
      password: 'mypassword123'
    }

    await createUser(userData, testOptions)

    // Get the user with timestamps
    const result = await db.sql`SELECT created_at, updated_at FROM users WHERE email = ${userData.email}`
    const user = result.rows?.[0]

    expect(user?.created_at).toBeDefined()
    expect(user?.updated_at).toBeDefined()

    // Check that timestamps are valid dates
    const createdAt = new Date(user?.created_at as string)
    const updatedAt = new Date(user?.updated_at as string)

    expect(createdAt.toString()).not.toBe('Invalid Date')
    expect(updatedAt.toString()).not.toBe('Invalid Date')

    // Check that timestamps are not null/undefined
    expect(user?.created_at).not.toBeNull()
    expect(user?.updated_at).not.toBeNull()
  })

  it('should throw error for duplicate email', async () => {
    const userData = {
      email: 'test@webmania.cc',
      name: 'Test User',
      password: 'mypassword123'
    }

    // Create first user
    await createUser(userData, testOptions)

    // Try to create second user with same email
    await expect(createUser(userData, testOptions)).rejects.toThrow()
  })

  it('should create user with default role', async () => {
    const userData = {
      email: 'test@webmania.cc',
      name: 'Test User',
      password: 'mypassword123'
    }

    await createUser(userData, testOptions)

    // Verify user was created with default role
    const result = await db.sql`SELECT role FROM users WHERE email = ${userData.email}`
    const user = result.rows?.[0]

    expect(user?.role).toBe('user')
  })

  it('should create user with custom role', async () => {
    const userData = {
      email: 'admin@webmania.cc',
      name: 'Admin User',
      password: 'mypassword123',
      role: 'admin'
    }

    await createUser(userData, testOptions)

    // Verify user was created with custom role
    const result = await db.sql`SELECT role FROM users WHERE email = ${userData.email}`
    const user = result.rows?.[0]

    expect(user?.role).toBe('admin')
  })

  it('should handle empty password', async () => {
    const userData = {
      email: 'test@webmania.cc',
      name: 'Test User',
      password: ''
    }

    await createUser(userData, testOptions)

    // Verify user was created (empty password is valid)
    const result = await db.sql`SELECT email FROM users WHERE email = ${userData.email}`
    expect(result.rows?.[0]).toBeDefined()
  })

  it('should handle special characters in name and email', async () => {
    const userData = {
      email: 'test+user@webmania.cc',
      name: 'Test User with Special Chars: !@#$%^&*()',
      password: 'mypassword123'
    }

    await createUser(userData, testOptions)

    // Verify user was created
    const result = await db.sql`SELECT email, name FROM users WHERE email = ${userData.email}`
    const user = result.rows?.[0]

    expect(user).toBeDefined()
    expect(user?.email).toBe(userData.email)
    expect(user?.name).toBe(userData.name)
  })
})
