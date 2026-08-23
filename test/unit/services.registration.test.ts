import { describe, it, expect, beforeEach, vi } from 'vitest'
import bcrypt from 'bcrypt'
import type { ModuleOptions } from '../../src/types'
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
    findUserByEmail: vi.fn(),
  }
})

const {
  registerUser,
  sendConfirmationEmail,
  confirmUserEmail,
} = await import('../../src/runtime/server/services/registration')
const { useDb, findUserByEmail } = await import('../../src/runtime/server/utils')

const registrationData = {
  email: 'new@example.com',
  name: 'New User',
  password: 'ValidPass123!',
}

const createValidTokenRows = async (plainToken: string, createdAt: Date | string, id = 1) => {
  const hashedToken = await bcrypt.hash(plainToken, 10)
  return [{
    id,
    email: 'new@example.com',
    token: hashedToken,
    created_at: createdAt,
  }]
}

describe('Registration Service', () => {
  let testOptions: ModuleOptions
  let mockSql: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    testOptions = {
      ...defaultOptions,
      passwordValidation: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true,
      },
    }

    mockSql = vi.fn()
    vi.mocked(useDb).mockResolvedValue({ sql: mockSql } as never)
    vi.mocked(findUserByEmail).mockResolvedValue(null)
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })
  })

  describe('registerUser', () => {
    it('should reject registration when the email is already taken', async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({
        id: 1,
        email: registrationData.email,
        name: 'Existing User',
        password: 'hashed-password',
        role: 'user',
        active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      })

      await expect(
        registerUser(registrationData, testOptions, 'https://app.example.com'),
      ).rejects.toThrow('A user with this email already exists')

      expect(useDb).not.toHaveBeenCalled()
    })

    it('should reject registration when password validation fails', async () => {
      await expect(
        registerUser(
          { ...registrationData, password: 'weak' },
          testOptions,
          'https://app.example.com',
        ),
      ).rejects.toThrow('Password validation failed')

      expect(useDb).not.toHaveBeenCalled()
    })

    it('should create an inactive user, store a token, and send a confirmation email', async () => {
      mockSql
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            email: registrationData.email,
            name: registrationData.name,
            role: 'user',
            created_at: new Date('2024-01-01T00:00:00.000Z'),
            updated_at: new Date('2024-01-01T00:00:00.000Z'),
          }],
        })
        .mockResolvedValue({ rows: [] })

      const result = await registerUser(
        registrationData,
        testOptions,
        'https://app.example.com',
      )

      expect(result.message).toContain('Please check your email')
      expect(result.user.email).toBe(registrationData.email)
      expect(result.user.name).toBe(registrationData.name)
      expect(result.user.role).toBe('user')
      expect(result.user.created_at).toBe('2024-01-01T00:00:00.000Z')
      expect(result.user).not.toHaveProperty('active')
      expect(mockSql).toHaveBeenCalledTimes(3)

      const tokenInsertArgs = mockSql.mock.calls[2]?.flat() ?? []
      const storedToken = tokenInsertArgs.find(
        (arg): arg is string => typeof arg === 'string' && arg.startsWith('$2'),
      )
      expect(storedToken).toBeDefined()
      expect(mockSendMail).toHaveBeenCalledTimes(1)

      const mailOptions = mockSendMail.mock.calls[0]?.[0]
      expect(mailOptions.to).toBe(registrationData.email)
      expect(mailOptions.html).toContain('https://app.example.com/api/nuxt-users/confirm-email?')
      expect(mailOptions.html).toContain('email=new%40example.com')
      expect(mailOptions.html).toContain('token=')
    })

    it('should still succeed when sending the confirmation email fails', async () => {
      mockSql
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            email: registrationData.email,
            name: registrationData.name,
            role: 'user',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          }],
        })
        .mockResolvedValue({ rows: [] })
      mockSendMail.mockRejectedValue(new Error('SMTP unavailable'))

      const result = await registerUser(
        registrationData,
        testOptions,
        'https://app.example.com',
      )

      expect(result.user.email).toBe(registrationData.email)
      expect(mockSql).toHaveBeenCalledTimes(3)
      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })
  })

  describe('sendConfirmationEmail', () => {
    it('should return silently when mailer configuration is missing', async () => {
      await expect(
        sendConfirmationEmail(
          registrationData.email,
          registrationData.name,
          'confirmation-token',
          { ...testOptions, mailer: undefined },
          'https://app.example.com',
        ),
      ).resolves.toBeUndefined()

      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('should send a confirmation link with token and email query params', async () => {
      await sendConfirmationEmail(
        registrationData.email,
        registrationData.name,
        'confirmation-token',
        testOptions,
        'https://app.example.com',
      )

      expect(mockSendMail).toHaveBeenCalledTimes(1)

      const mailOptions = mockSendMail.mock.calls[0]?.[0]
      expect(mailOptions.to).toBe(registrationData.email)
      expect(mailOptions.html).toContain('token=confirmation-token')
      expect(mailOptions.html).toContain('email=new%40example.com')
    })
  })

  describe('confirmUserEmail', () => {
    it('should accept created_at as a Date object (MySQL driver behavior)', async () => {
      const plainToken = 'valid-confirmation-token'

      mockSql
        .mockResolvedValueOnce({
          rows: await createValidTokenRows(plainToken, new Date()),
        })
        .mockResolvedValue({ rows: [] })

      const result = await confirmUserEmail(
        plainToken,
        'new@example.com',
        testOptions,
      )

      expect(result).toBe(true)
      expect(mockSql).toHaveBeenCalledTimes(3)

      const updateCallArgs = mockSql.mock.calls[1]?.flat() ?? []
      expect(updateCallArgs).toContain('new@example.com')
    })

    it('should accept created_at as a string (SQLite driver behavior)', async () => {
      const plainToken = 'valid-confirmation-token'
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

      mockSql
        .mockResolvedValueOnce({
          rows: await createValidTokenRows(plainToken, createdAt),
        })
        .mockResolvedValue({ rows: [] })

      const result = await confirmUserEmail(
        plainToken,
        'new@example.com',
        testOptions,
      )

      expect(result).toBe(true)
    })

    it('should return false when no confirmation tokens exist', async () => {
      mockSql.mockResolvedValueOnce({ rows: [] })

      const result = await confirmUserEmail(
        'any-token',
        'new@example.com',
        testOptions,
      )

      expect(result).toBe(false)
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it('should return false when the token does not match any stored hash', async () => {
      const hashedToken = await bcrypt.hash('stored-token', 10)

      mockSql.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'new@example.com',
          token: hashedToken,
          created_at: new Date(),
        }],
      })

      const result = await confirmUserEmail(
        'wrong-token',
        'new@example.com',
        testOptions,
      )

      expect(result).toBe(false)
    })

    it('should return false for malformed created_at values', async () => {
      const plainToken = 'valid-confirmation-token'

      mockSql.mockResolvedValueOnce({
        rows: await createValidTokenRows(plainToken, 'not-a-timestamp'),
      })

      const result = await confirmUserEmail(
        plainToken,
        'new@example.com',
        testOptions,
      )

      expect(result).toBe(false)
    })

    it('should reject expired tokens when created_at is a Date object', async () => {
      const plainToken = 'expired-confirmation-token'
      const createdAt = new Date()
      createdAt.setHours(createdAt.getHours() - 25)

      mockSql
        .mockResolvedValueOnce({
          rows: await createValidTokenRows(plainToken, createdAt, 42),
        })
        .mockResolvedValue({ rows: [] })

      const result = await confirmUserEmail(
        plainToken,
        'new@example.com',
        testOptions,
      )

      expect(result).toBe(false)
      expect(mockSql).toHaveBeenCalledTimes(2)

      const deleteCallArgs = mockSql.mock.calls[1]?.flat() ?? []
      expect(deleteCallArgs).toContain(42)
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
              email: 'new@example.com',
              token: olderTokenHash,
              created_at: new Date(),
            },
            validTokenRows[0],
          ],
        })
        .mockResolvedValue({ rows: [] })

      const result = await confirmUserEmail(
        validToken,
        'new@example.com',
        testOptions,
      )

      expect(result).toBe(true)
    })

    it('should delete the used token after successful confirmation', async () => {
      const plainToken = 'valid-confirmation-token'

      mockSql
        .mockResolvedValueOnce({
          rows: await createValidTokenRows(plainToken, new Date(), 7),
        })
        .mockResolvedValue({ rows: [] })

      await confirmUserEmail(
        plainToken,
        'new@example.com',
        testOptions,
      )

      expect(mockSql).toHaveBeenCalledTimes(3)

      const deleteCallArgs = mockSql.mock.calls[2]?.flat() ?? []
      expect(deleteCallArgs).toContain(7)
    })
  })
})
