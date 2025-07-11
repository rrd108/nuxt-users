import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendPasswordResetLink, resetPassword, deleteExpiredPasswordResetTokens } from '../src/runtime/server/services/password'
import * as userUtils from '../src/runtime/server/utils/user' // To mock its functions
import { createDatabase } from 'db0'
import bcrypt from 'bcrypt'
import crypto from 'node:crypto'
import { createTransport } from 'nodemailer'
import type { ModuleOptions, User } from '../src/types'

// --- Mocks ---
vi.mock('db0', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual as Record<string, unknown>,
    createDatabase: vi.fn(() => ({
      sql: vi.fn(),
      raw: vi.fn((str: string) => str),
    })),
  }
})

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  }
}))

vi.mock('node:crypto', () => ({
  default: { // Assuming crypto is used as default import in the service
    randomBytes: vi.fn(() => ({ toString: vi.fn() })),
  }
}))

const mockSendMail = vi.fn()
vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: mockSendMail,
  })),
}))

vi.mock('../src/runtime/server/utils/db', () => ({
  getConnector: vi.fn().mockResolvedValue(vi.fn()),
}))

// Mock user utilities
vi.mock('../src/runtime/server/utils/user')

// Mock useRuntimeConfig
const mockNuxtUsersOptions: ModuleOptions = {
  connector: { name: 'sqlite', options: { path: ':memory:' } },
  tables: { users: true, personalAccessTokens: true, passwordResetTokens: true },
  mailer: {
    host: 'smtp.example.com', port: 587, auth: { user: 'user', pass: 'pass' },
    defaults: { from: 'test@example.com' }
  },
  passwordResetBaseUrl: 'http://localhost:3000',
}

describe('Password Service (src/runtime/server/services/password.ts)', () => {
  let mockDb: { sql: ReturnType<typeof vi.fn>, raw: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()
    const dbInstance = { sql: vi.fn(), raw: vi.fn((str: string) => str) }
    ;(createDatabase as any).mockReturnValue(dbInstance)
    mockDb = dbInstance
  })

  describe('sendPasswordResetLink', () => {
    const email = 'test@example.com'
    const mockUser = { id: 1, email, name: 'Test User' } as User
    const rawToken = 'rawTestToken'
    const hashedToken = 'hashedTestToken'

    it('should do nothing if user not found (to prevent enumeration)', async () => {
      vi.mocked(userUtils.findUserByEmail).mockResolvedValue(null)
      await sendPasswordResetLink(email, mockNuxtUsersOptions)
      expect(mockDb.sql).not.toHaveBeenCalled() // No DB interaction for token
      expect(createTransport).not.toHaveBeenCalled()
    })

    it('should generate token, store hashed token, and send email if user found', async () => {
      vi.mocked(userUtils.findUserByEmail).mockResolvedValue(mockUser)
      vi.mocked(crypto.randomBytes).mockReturnValue({ toString: vi.fn(() => rawToken) })
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedToken)
      mockDb.sql.mockResolvedValue({ rows: [] }) // For INSERT
      mockSendMail.mockResolvedValue({})

      await sendPasswordResetLink(email, mockNuxtUsersOptions)

      expect(userUtils.findUserByEmail).toHaveBeenCalledWith(email, mockNuxtUsersOptions)
      expect(crypto.randomBytes).toHaveBeenCalledWith(32)
      expect(bcrypt.hash).toHaveBeenCalledWith(rawToken, 10)
      expect(mockDb.sql).toHaveBeenCalledWith(
        expect.arrayContaining([`
    INSERT INTO password_reset_tokens (email, token, created_at)
    VALUES (`, ', ', `, CURRENT_TIMESTAMP)
  `]),
        email,
        hashedToken
      )
      expect(createTransport).toHaveBeenCalledWith({
        host: mockNuxtUsersOptions.mailer!.host,
        port: mockNuxtUsersOptions.mailer!.port,
        secure: mockNuxtUsersOptions.mailer!.secure,
        auth: {
          user: mockNuxtUsersOptions.mailer!.auth.user,
          pass: mockNuxtUsersOptions.mailer!.auth.pass,
        },
      })
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: email,
        subject: 'Password Reset Request',
        text: expect.stringContaining(mockNuxtUsersOptions.passwordResetBaseUrl!),
        html: expect.stringContaining(mockNuxtUsersOptions.passwordResetBaseUrl!),
      }))
    })

    it('should not send email if mailer config is missing', async () => {
      const optionsWithoutMailer = { ...mockNuxtUsersOptions, mailer: undefined }

      vi.mocked(userUtils.findUserByEmail).mockResolvedValue(mockUser)
      // Mock other necessary functions to prevent errors before mailer check
      vi.mocked(crypto.randomBytes).mockReturnValue({ toString: vi.fn(() => rawToken) })
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedToken)
      mockDb.sql.mockResolvedValue({ rows: [] })

      await sendPasswordResetLink(email, optionsWithoutMailer)

      expect(createTransport).not.toHaveBeenCalled()
      expect(mockSendMail).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    const token = 'rawTestToken'
    const email = 'test@example.com'
    const newPassword = 'newPassword123'
    const storedHashedToken = 'hashedTestToken'
    const tokenRecord = { id: 1, email, token: storedHashedToken, created_at: new Date().toISOString() }

    it('should return false if no token records found for email', async () => {
      mockDb.sql.mockResolvedValue({ rows: [] }) // No tokens found
      const result = await resetPassword(token, email, newPassword, mockNuxtUsersOptions)
      expect(result).toBe(false)
    })

    it('should return false if token does not match any stored hashed tokens', async () => {
      mockDb.sql.mockResolvedValue({ rows: [tokenRecord] }) // Found a record
      vi.mocked(bcrypt.compare).mockResolvedValue(false) // Token compare fails
      const result = await resetPassword(token, email, newPassword, mockNuxtUsersOptions)
      expect(result).toBe(false)
    })

    it('should return false if token is expired', async () => {
      const expiredDate = new Date()
      expiredDate.setHours(expiredDate.getHours() - 2) // 2 hours ago
      const expiredTokenRecord = { ...tokenRecord, created_at: expiredDate.toISOString() }
      mockDb.sql.mockResolvedValueOnce({ rows: [expiredTokenRecord] }) // Find token
      vi.mocked(bcrypt.compare).mockResolvedValue(true) // Token matches

      const result = await resetPassword(token, email, newPassword, mockNuxtUsersOptions)

      expect(result).toBe(false)
      expect(mockDb.sql).toHaveBeenCalledWith( // Expect deletion of the specific expired token
        expect.arrayContaining(['DELETE FROM password_reset_tokens WHERE id = ']),
        expiredTokenRecord.id
      )
    })

    it('should update password and delete tokens if token is valid and not expired', async () => {
      mockDb.sql.mockResolvedValueOnce({ rows: [tokenRecord] }) // Find token
      vi.mocked(bcrypt.compare).mockResolvedValue(true) // Token matches
      vi.mocked(userUtils.updateUserPassword).mockResolvedValue(undefined)
      mockDb.sql.mockResolvedValueOnce({ rows: [] }) // For DELETE

      const result = await resetPassword(token, email, newPassword, mockNuxtUsersOptions)

      expect(result).toBe(true)
      expect(userUtils.updateUserPassword).toHaveBeenCalledWith(email, newPassword, mockNuxtUsersOptions)
      expect(mockDb.sql).toHaveBeenCalledWith(
        expect.arrayContaining(['DELETE FROM password_reset_tokens WHERE email = ']),
        email
      )
    })
  })

  describe('deleteExpiredPasswordResetTokens', () => {
    it('should construct and execute a DELETE SQL query for expired tokens', async () => {
      mockDb.sql.mockResolvedValue({ rows: [] }) // Mock DB response for DELETE

      await deleteExpiredPasswordResetTokens(mockNuxtUsersOptions)

      expect(mockDb.sql).toHaveBeenCalledWith(
        expect.arrayContaining([`
    DELETE FROM password_reset_tokens
    WHERE created_at < `]),
        expect.any(String) // Expecting an ISO string for the date
      )
    })
  })
})
