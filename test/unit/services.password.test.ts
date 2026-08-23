import { describe, it, expect, beforeEach, vi } from 'vitest'
import bcrypt from 'bcrypt'
import type { ModuleOptions, UserWithoutPassword } from '../../src/types'
import { defaultOptions } from '../../src/module'

const mockSendMail = vi.fn()

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: mockSendMail,
  })),
}))

vi.mock('../../src/runtime/server/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/runtime/server/utils')>()
  return {
    ...actual,
    useDb: vi.fn(),
    updateUserPassword: vi.fn(),
    findUserByEmail: vi.fn(),
  }
})

const {
  resetPassword,
  sendPasswordResetLink,
  deleteExpiredPasswordResetTokens,
} = await import('../../src/runtime/server/services/password')
const { useDb, updateUserPassword, findUserByEmail } = await import('../../src/runtime/server/utils')

const testUser: UserWithoutPassword = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

const createValidTokenRows = async (plainToken: string, createdAt: Date | string, id = 1) => {
  const hashedToken = await bcrypt.hash(plainToken, 10)
  return [{
    id,
    email: 'test@example.com',
    token: hashedToken,
    created_at: createdAt,
  }]
}

describe('Password Service', () => {
  let testOptions: ModuleOptions
  let mockSql: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    testOptions = {
      ...defaultOptions,
    }

    mockSql = vi.fn()
    vi.mocked(useDb).mockResolvedValue({ sql: mockSql } as never)
    vi.mocked(updateUserPassword).mockResolvedValue(undefined)
    vi.mocked(findUserByEmail).mockResolvedValue(testUser)
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })
  })

  describe('resetPassword', () => {
    it('should accept created_at as a Date object (MySQL driver behavior)', async () => {
      const plainToken = 'valid-reset-token'

      mockSql
        .mockResolvedValueOnce({
          rows: await createValidTokenRows(plainToken, new Date()),
        })
        .mockResolvedValue({ rows: [] })

      const result = await resetPassword(
        plainToken,
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )

      expect(result).toBe(true)
      expect(updateUserPassword).toHaveBeenCalledWith(
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )
    })

    it('should accept created_at as a string (SQLite driver behavior)', async () => {
      const plainToken = 'valid-reset-token'
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

      mockSql
        .mockResolvedValueOnce({
          rows: await createValidTokenRows(plainToken, createdAt),
        })
        .mockResolvedValue({ rows: [] })

      const result = await resetPassword(
        plainToken,
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )

      expect(result).toBe(true)
      expect(updateUserPassword).toHaveBeenCalledWith(
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )
    })

    it('should return false when no tokens exist for the email', async () => {
      mockSql.mockResolvedValueOnce({ rows: [] })

      const result = await resetPassword(
        'any-token',
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )

      expect(result).toBe(false)
      expect(updateUserPassword).not.toHaveBeenCalled()
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it('should return false when the token does not match any stored hash', async () => {
      const hashedToken = await bcrypt.hash('stored-token', 10)

      mockSql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          token: hashedToken,
          created_at: new Date(),
        }],
      })

      const result = await resetPassword(
        'wrong-token',
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )

      expect(result).toBe(false)
      expect(updateUserPassword).not.toHaveBeenCalled()
    })

    it('should return false for malformed created_at values', async () => {
      const plainToken = 'valid-reset-token'

      mockSql.mockResolvedValueOnce({
        rows: await createValidTokenRows(plainToken, 'not-a-timestamp'),
      })

      const result = await resetPassword(
        plainToken,
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )

      expect(result).toBe(false)
      expect(updateUserPassword).not.toHaveBeenCalled()
    })

    it('should reject expired tokens when created_at is a Date object', async () => {
      const plainToken = 'expired-reset-token'
      const createdAt = new Date()
      createdAt.setHours(createdAt.getHours() - 2)

      mockSql
        .mockResolvedValueOnce({
          rows: await createValidTokenRows(plainToken, createdAt, 42),
        })
        .mockResolvedValue({ rows: [] })

      const result = await resetPassword(
        plainToken,
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )

      expect(result).toBe(false)
      expect(updateUserPassword).not.toHaveBeenCalled()
      expect(mockSql).toHaveBeenCalledTimes(2)

      const deleteCallArgs = mockSql.mock.calls[1]?.flat() ?? []
      expect(deleteCallArgs).toContain(42)
    })

    it('should reject expired tokens when created_at is a string', async () => {
      const plainToken = 'expired-reset-token'
      const createdAt = new Date()
      createdAt.setHours(createdAt.getHours() - 2)
      const createdAtString = createdAt.toISOString().slice(0, 19).replace('T', ' ')

      mockSql
        .mockResolvedValueOnce({
          rows: await createValidTokenRows(plainToken, createdAtString),
        })
        .mockResolvedValue({ rows: [] })

      const result = await resetPassword(
        plainToken,
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )

      expect(result).toBe(false)
      expect(updateUserPassword).not.toHaveBeenCalled()
    })

    it('should match the correct token when multiple tokens exist for the email', async () => {
      const validToken = 'newest-valid-token'
      const olderTokenHash = await bcrypt.hash('older-token', 10)
      const validTokenRows = await createValidTokenRows(validToken, new Date(), 2)

      mockSql
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              email: 'test@example.com',
              token: olderTokenHash,
              created_at: new Date(),
            },
            validTokenRows[0],
          ],
        })
        .mockResolvedValue({ rows: [] })

      const result = await resetPassword(
        validToken,
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )

      expect(result).toBe(true)
      expect(updateUserPassword).toHaveBeenCalledWith(
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )
    })

    it('should delete all tokens for the email after a successful reset', async () => {
      const plainToken = 'valid-reset-token'

      mockSql
        .mockResolvedValueOnce({
          rows: await createValidTokenRows(plainToken, new Date()),
        })
        .mockResolvedValue({ rows: [] })

      await resetPassword(
        plainToken,
        'test@example.com',
        'NewPassword123!',
        testOptions,
      )

      expect(mockSql).toHaveBeenCalledTimes(2)

      const deleteCallArgs = mockSql.mock.calls[1]?.flat() ?? []
      expect(deleteCallArgs).toContain('test@example.com')
    })
  })

  describe('sendPasswordResetLink', () => {
    it('should return silently when the email does not belong to a user', async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null)

      await expect(
        sendPasswordResetLink('missing@example.com', testOptions, 'https://app.example.com'),
      ).resolves.toBeUndefined()

      expect(useDb).not.toHaveBeenCalled()
      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('should store a hashed token and send a reset email for existing users', async () => {
      mockSql.mockResolvedValue({ rows: [] })

      await sendPasswordResetLink('test@example.com', testOptions, 'https://app.example.com')

      expect(useDb).toHaveBeenCalledWith(testOptions)
      expect(mockSql).toHaveBeenCalledTimes(1)

      const insertCallArgs = mockSql.mock.calls[0]?.flat() ?? []
      expect(insertCallArgs).toContain('test@example.com')

      const storedToken = insertCallArgs.find(
        (arg): arg is string => typeof arg === 'string' && arg.startsWith('$2'),
      )
      expect(storedToken).toBeDefined()

      expect(mockSendMail).toHaveBeenCalledTimes(1)

      const mailOptions = mockSendMail.mock.calls[0]?.[0]
      expect(mailOptions.to).toBe('test@example.com')
      expect(mailOptions.html).toContain('https://app.example.com/reset-password?')
      expect(mailOptions.html).toContain('email=test%40example.com')
      expect(mailOptions.html).toContain('token=')
    })

    it('should still store the token when mailer configuration is missing', async () => {
      mockSql.mockResolvedValue({ rows: [] })

      await sendPasswordResetLink('test@example.com', {
        ...testOptions,
        mailer: undefined,
      })

      expect(mockSql).toHaveBeenCalledTimes(1)
      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('should not throw when sending the reset email fails', async () => {
      mockSql.mockResolvedValue({ rows: [] })
      mockSendMail.mockRejectedValue(new Error('SMTP unavailable'))

      await expect(
        sendPasswordResetLink('test@example.com', testOptions, 'https://app.example.com'),
      ).resolves.toBeUndefined()

      expect(mockSql).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteExpiredPasswordResetTokens', () => {
    it('should delete tokens using MySQL-compatible datetime format', async () => {
      mockSql.mockResolvedValue({ rows: [] })

      await deleteExpiredPasswordResetTokens(testOptions)

      expect(mockSql).toHaveBeenCalledTimes(1)

      const callArgs = mockSql.mock.calls[0]?.flat() ?? []
      const expirationArg = callArgs.find(
        (arg): arg is string => typeof arg === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(arg),
      )

      expect(expirationArg).toBeDefined()
      expect(expirationArg).not.toContain('T')
      expect(expirationArg).not.toContain('Z')
    })
  })
})
