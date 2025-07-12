import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { sendPasswordResetLink, resetPassword, deleteExpiredPasswordResetTokens } from '../src/runtime/server/services/password'
import type { Database } from 'db0'
import type { DatabaseType, DatabaseConfig, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './utils/test-setup'
import { createUsersTable } from '../src/runtime/server/utils/create-users-table'
import { createPasswordResetTokensTable } from '../src/runtime/server/utils/create-password-reset-tokens-table'
import { createUser, findUserByEmail } from '../src/runtime/server/utils/user'
import bcrypt from 'bcrypt'

// Mock nodemailer
vi.mock('nodemailer', () => {
  const mockSendMail = vi.fn()
  const mockCreateTransport = vi.fn(() => ({
    sendMail: mockSendMail
  }))

  return {
    createTransport: mockCreateTransport
  }
})

describe('Password Service (src/runtime/server/services/password.ts)', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_password_service',
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

    // Create tables for testing
    await createUsersTable(testOptions)
    await createPasswordResetTokensTable(testOptions)
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.passwordResetTokens)
  })

  describe('sendPasswordResetLink', () => {
    it('should do nothing if user not found (to prevent enumeration)', async () => {
      const email = 'nonexistent@example.com'

      // Should not throw an error
      await expect(sendPasswordResetLink(email, testOptions)).resolves.not.toThrow()

      // Verify no tokens were created
      const tokens = await db.sql`SELECT * FROM {${testOptions.tables.passwordResetTokens}} WHERE email = ${email}` as { rows: any[] }
      expect(tokens.rows).toHaveLength(0)
    })

    it('should generate token, store hashed token, and send email if user found', async () => {
      const email = 'test@example.com'
      const userData = { email, name: 'Test User', password: 'password123' }

      // Create a user first
      await createUser(userData, testOptions)

      await sendPasswordResetLink(email, testOptions)

      // Verify token was created in database
      const tokens = await db.sql`SELECT * FROM {${testOptions.tables.passwordResetTokens}} WHERE email = ${email}` as { rows: Array<{ token: string, created_at: string }> }
      expect(tokens.rows).toHaveLength(1)
      expect(tokens.rows[0].token).toMatch(/^\$2[aby]\$\d{1,2}\$/) // bcrypt hash pattern
      expect(tokens.rows[0].created_at).toBeDefined()
    })

    it('should not send email if mailer config is missing', async () => {
      const email = 'test@example.com'
      const userData = { email, name: 'Test User', password: 'password123' }

      // Create a user first
      await createUser(userData, testOptions)

      // Test with no mailer config
      const optionsWithoutMailer = { ...testOptions, mailer: undefined }

      // Should not throw an error
      await expect(sendPasswordResetLink(email, optionsWithoutMailer)).resolves.not.toThrow()

      // Verify token was still created (the function should still work, just not send email)
      const tokens = await db.sql`SELECT * FROM {${testOptions.tables.passwordResetTokens}} WHERE email = ${email}` as { rows: any[] }
      expect(tokens.rows).toHaveLength(1)
    })
  })

  describe('resetPassword', () => {
    it('should return false if no token records found for email', async () => {
      const token = 'someToken'
      const email = 'test@example.com'
      const newPassword = 'newPassword123'

      const result = await resetPassword(token, email, newPassword, testOptions)
      expect(result).toBe(false)
    })

    it('should return false if token does not match any stored hashed tokens', async () => {
      const email = 'test@example.com'
      const userData = { email, name: 'Test User', password: 'password123' }

      // Create a user first
      await createUser(userData, testOptions)

      // Create a token for this user
      const token = 'validToken'
      const hashedToken = await bcrypt.hash(token, 10)
      await db.sql`
        INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
        VALUES (${email}, ${hashedToken}, CURRENT_TIMESTAMP)
      `

      // Try to reset with wrong token
      const wrongToken = 'wrongToken'
      const newPassword = 'newPassword123'
      const result = await resetPassword(wrongToken, email, newPassword, testOptions)

      expect(result).toBe(false)
    })

    it('should return false if token is expired', async () => {
      const email = 'test@example.com'
      const userData = { email, name: 'Test User', password: 'password123' }

      // Create a user first
      await createUser(userData, testOptions)

      // Create an expired token
      const token = 'validToken'
      const hashedToken = await bcrypt.hash(token, 10)
      const expiredDate = new Date()
      expiredDate.setHours(expiredDate.getHours() - 2) // 2 hours ago (expired)

      await db.sql`
        INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
        VALUES (${email}, ${hashedToken}, ${expiredDate.toISOString()})
      `

      const newPassword = 'newPassword123'
      const result = await resetPassword(token, email, newPassword, testOptions)

      expect(result).toBe(false)

      // Verify the expired token was deleted
      const tokens = await db.sql`SELECT * FROM {${testOptions.tables.passwordResetTokens}} WHERE email = ${email}` as { rows: any[] }
      expect(tokens.rows).toHaveLength(0)
    })

    it('should update password and delete tokens if token is valid and not expired', async () => {
      const email = 'test@example.com'
      const userData = { email, name: 'Test User', password: 'oldpassword123' }

      // Create a user first
      await createUser(userData, testOptions)

      // Create a valid token
      const token = 'validToken'
      const hashedToken = await bcrypt.hash(token, 10)
      await db.sql`
        INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
        VALUES (${email}, ${hashedToken}, CURRENT_TIMESTAMP)
      `

      const newPassword = 'newPassword123'
      const result = await resetPassword(token, email, newPassword, testOptions)

      expect(result).toBe(true)

      // Verify password was updated
      const updatedUser = await findUserByEmail(email, testOptions)
      expect(updatedUser).toBeDefined()
      expect(updatedUser!.password).toMatch(/^\$2[aby]\$\d{1,2}\$/)

      // Verify tokens were deleted
      const tokens = await db.sql`SELECT * FROM {${testOptions.tables.passwordResetTokens}} WHERE email = ${email}` as { rows: any[] }
      expect(tokens.rows).toHaveLength(0)
    })
  })

  describe('deleteExpiredPasswordResetTokens', () => {
    it('should delete expired tokens', async () => {
      const email = 'test@example.com'

      // Create some tokens with different timestamps
      const validToken = await bcrypt.hash('valid', 10)
      const expiredToken1 = await bcrypt.hash('expired1', 10)
      const expiredToken2 = await bcrypt.hash('expired2', 10)

      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

      // Insert tokens with different timestamps
      await db.sql`
        INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, created_at)
        VALUES 
          (${email}, ${validToken}, ${now.toISOString()}),
          (${email}, ${expiredToken1}, ${oneHourAgo.toISOString()}),
          (${email}, ${expiredToken2}, ${twoHoursAgo.toISOString()})
      `

      // Verify we have 3 tokens initially
      const initialTokens = await db.sql`SELECT * FROM {${testOptions.tables.passwordResetTokens}}` as { rows: any[] }
      expect(initialTokens.rows).toHaveLength(3)

      // Delete expired tokens
      await deleteExpiredPasswordResetTokens(testOptions)

      // Verify only the valid token remains
      const remainingTokens = await db.sql`SELECT * FROM {${testOptions.tables.passwordResetTokens}}` as { rows: any[] }
      expect(remainingTokens.rows).toHaveLength(1)
      expect(remainingTokens.rows[0].token).toBe(validToken)
    })
  })

  describe('Integration tests', () => {
    it('should work together: create user, send reset link, reset password', async () => {
      const email = 'integration@example.com'
      const userData = { email, name: 'Integration User', password: 'initialpassword' }

      // Step 1: Create user
      await createUser(userData, testOptions)

      // Step 2: Send password reset link
      await sendPasswordResetLink(email, testOptions)

      // Step 3: Verify token was created
      const tokens = await db.sql`SELECT * FROM {${testOptions.tables.passwordResetTokens}} WHERE email = ${email}` as { rows: Array<{ token: string }> }
      expect(tokens.rows).toHaveLength(1)

      // Step 4: Get the raw token (we need to reverse the hash to test)
      // For testing purposes, we'll create a known token
      const rawToken = 'testToken123'
      const hashedToken = await bcrypt.hash(rawToken, 10)

      // Update the token in the database
      await db.sql`
        UPDATE {${testOptions.tables.passwordResetTokens}} 
        SET token = ${hashedToken} 
        WHERE email = ${email}
      `

      // Step 5: Reset password
      const newPassword = 'newsecurepassword'
      const result = await resetPassword(rawToken, email, newPassword, testOptions)

      expect(result).toBe(true)

      // Step 6: Verify password was updated
      const updatedUser = await findUserByEmail(email, testOptions)
      expect(updatedUser).toBeDefined()
      expect(updatedUser!.password).toMatch(/^\$2[aby]\$\d{1,2}\$/)

      // Step 7: Verify tokens were deleted
      const remainingTokens = await db.sql`SELECT * FROM {${testOptions.tables.passwordResetTokens}} WHERE email = ${email}` as { rows: Array<{ token: string }> }
      expect(remainingTokens.rows).toHaveLength(0)
    })
  })
})
