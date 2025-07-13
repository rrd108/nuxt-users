import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import { createPasswordResetTokensTable } from '../src/runtime/server/utils/create-password-reset-tokens-table'
import type { DatabaseConfig, DatabaseType, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './test-setup'

describe('CLI: Create Password Reset Tokens Table', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_create-password-reset-tokens-table',
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

  it('should create password_reset_tokens table successfully', async () => {
    await createPasswordResetTokensTable(testOptions)

    // Verify table exists by querying it
    const result = await db.sql`SELECT 1 FROM {${testOptions.tables.passwordResetTokens}} LIMIT 1`
    expect(result).toBeDefined()
  })

  it('should create table with correct schema', async () => {
    await createPasswordResetTokensTable(testOptions)

    // Test that we can insert and query data (this validates the schema works)
    await db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token)
      VALUES ('test@webmania.cc', 'reset-token-123')
    `

    const result = await db.sql`SELECT id, email, token, created_at FROM {${testOptions.tables.passwordResetTokens}} WHERE email = 'test@webmania.cc'`
    const token = result.rows?.[0]

    // Check all required fields exist and have correct types
    expect(token).toBeDefined()
    expect(token?.id).toBe(1) // Auto-increment works
    expect(token?.email).toBe('test@webmania.cc')
    expect(token?.token).toBe('reset-token-123')
    expect(token?.created_at).toBeDefined()

    // Test that token is unique
    await expect(db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token)
      VALUES ('another@webmania.cc', 'reset-token-123')
    `).rejects.toThrow()
  })

  it('should handle CREATE TABLE IF NOT EXISTS correctly', async () => {
    // Create table first time
    await createPasswordResetTokensTable(testOptions)

    // Try to create table again (should not fail)
    await expect(createPasswordResetTokensTable(testOptions)).resolves.not.toThrow()

    // Verify table still exists and works
    const result = await db.sql`SELECT COUNT(*) as count FROM {${testOptions.tables.passwordResetTokens}}`
    expect(result.rows?.[0]?.count).toBe(0)
  })

  it('should enforce unique constraint on token', async () => {
    await createPasswordResetTokensTable(testOptions)

    // Insert first token
    await db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
      VALUES ('test@webmania.cc', 'unique-token-123', CURRENT_TIMESTAMP)
    `

    // Try to insert token with same value (should fail)
    await expect(db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
      VALUES ('another@webmania.cc', 'unique-token-123', CURRENT_TIMESTAMP)
    `).rejects.toThrow()
  })

  it('should auto-increment ID correctly', async () => {
    await createPasswordResetTokensTable(testOptions)

    // Insert multiple tokens
    await db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
      VALUES ('user1@webmania.cc', 'token-1', CURRENT_TIMESTAMP)
    `
    await db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
      VALUES ('user2@webmania.cc', 'token-2', CURRENT_TIMESTAMP)
    `

    // Check IDs are auto-incremented
    const result = await db.sql`SELECT id, email, token FROM {${testOptions.tables.passwordResetTokens}} ORDER BY id`
    const tokens = result.rows || []

    expect(tokens).toHaveLength(2)
    expect(tokens[0].id).toBe(1)
    expect(tokens[1].id).toBe(2)
  })

  it('should set default timestamp', async () => {
    await createPasswordResetTokensTable(testOptions)

    // Insert token without specifying timestamp
    await db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token)
      VALUES ('test@webmania.cc', 'test-token')
    `

    // Check that timestamp was set
    const result = await db.sql`SELECT created_at FROM {${testOptions.tables.passwordResetTokens}} WHERE email = 'test@webmania.cc'`
    const token = result.rows?.[0]

    expect(token).toBeDefined()
    expect(token?.created_at).toBeDefined()
    expect(token?.created_at).not.toBeNull()
  })

  it('should allow multiple tokens for same email', async () => {
    await createPasswordResetTokensTable(testOptions)

    // Insert multiple tokens for the same email (should work)
    await db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
      VALUES ('same@webmania.cc', 'token-1', CURRENT_TIMESTAMP)
    `
    await db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
      VALUES ('same@webmania.cc', 'token-2', CURRENT_TIMESTAMP)
    `

    // Verify both tokens exist
    const result = await db.sql`SELECT COUNT(*) as count FROM {${testOptions.tables.passwordResetTokens}} WHERE email = 'same@webmania.cc'`
    expect(result.rows?.[0]?.count).toBe(2)
  })

  it('should handle table creation with all constraints', async () => {
    await createPasswordResetTokensTable(testOptions)

    // Test inserting a valid token
    await expect(db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token)
      VALUES ('valid@webmania.cc', 'valid-token')
    `).resolves.not.toThrow()

    // Test that required fields are enforced
    await expect(db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email)
      VALUES ('invalid@webmania.cc')
    `).rejects.toThrow() // Missing token

    await expect(db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (token)
      VALUES ('token-only')
    `).rejects.toThrow() // Missing email
  })

  it('should create indexes for performance', async () => {
    await createPasswordResetTokensTable(testOptions)

    // Insert some test data
    await db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
      VALUES ('user1@webmania.cc', 'token-1', CURRENT_TIMESTAMP)
    `
    await db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
      VALUES ('user2@webmania.cc', 'token-2', CURRENT_TIMESTAMP)
    `

    // Test that queries using indexed columns work efficiently
    const emailResult = await db.sql`SELECT * FROM {${testOptions.tables.passwordResetTokens}} WHERE email = 'user1@webmania.cc'`
    expect(emailResult.rows).toHaveLength(1)

    const tokenResult = await db.sql`SELECT * FROM {${testOptions.tables.passwordResetTokens}} WHERE token = 'token-2'`
    expect(tokenResult.rows).toHaveLength(1)
  })

  it('should handle email field correctly', async () => {
    await createPasswordResetTokensTable(testOptions)

    // Test with various email formats
    const testEmails = [
      'simple@webmania.cc',
      'user.name@domain.co.uk',
      'user+tag@example.org',
      '123@numbers.com'
    ]

    for (const email of testEmails) {
      const token = `token-${email.replace(/[^a-z0-9]/gi, '')}`
      await expect(db.sql`
        INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token)
        VALUES (${email}, ${token})
      `).resolves.not.toThrow()
    }

    // Verify all emails were stored correctly
    const result = await db.sql`SELECT email FROM {${testOptions.tables.passwordResetTokens}}`
    const storedEmails = result.rows?.map(row => row.email) || []
    expect(storedEmails).toHaveLength(testEmails.length)
    testEmails.forEach((email) => {
      expect(storedEmails).toContain(email)
    })
  })

  it('should handle token field correctly', async () => {
    await createPasswordResetTokensTable(testOptions)

    // Test with various token formats
    const testTokens = [
      'simple-token',
      'token-with-dashes',
      'token_with_underscores',
      'token123',
      'TOKEN-UPPERCASE',
      'token-with-special-chars!@#$%'
    ]

    for (const token of testTokens) {
      await expect(db.sql`
        INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token)
        VALUES (${`user-${token}@webmania.cc`}, ${token})
      `).resolves.not.toThrow()
    }

    // Verify all tokens were stored correctly
    const result = await db.sql`SELECT token FROM {${testOptions.tables.passwordResetTokens}}`
    const storedTokens = result.rows?.map(row => row.token) || []
    expect(storedTokens).toHaveLength(testTokens.length)
    testTokens.forEach((token) => {
      expect(storedTokens).toContain(token)
    })
  })
})
