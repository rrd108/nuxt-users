import { describe, it, expect, beforeEach, vi } from 'vitest'
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

// The email token module has its own tests against a real database (test/email-token*.test.ts)
vi.mock('../../src/runtime/server/utils/email-token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/runtime/server/utils/email-token')>()
  return {
    ...actual,
    issueEmailToken: vi.fn(),
  }
})

const {
  registerUser,
  sendConfirmationEmail,
} = await import('../../src/runtime/server/services/registration')
const { useDb, findUserByEmail } = await import('../../src/runtime/server/utils')
const { issueEmailToken } = await import('../../src/runtime/server/utils/email-token')

const registrationData = {
  email: 'new@example.com',
  name: 'New User',
  password: 'ValidPass123!',
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
    vi.mocked(issueEmailToken).mockResolvedValue('plain-token')
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
      expect(issueEmailToken).toHaveBeenCalledWith(registrationData.email, 'email_confirmation', testOptions)
      expect(mockSendMail).toHaveBeenCalledTimes(1)

      const mailOptions = mockSendMail.mock.calls[0]?.[0]
      expect(mailOptions.to).toBe(registrationData.email)
      expect(mailOptions.html).toContain('https://app.example.com/api/nuxt-users/confirm-email?')
      expect(mailOptions.html).toContain('email=new%40example.com')
      expect(mailOptions.html).toContain('token=plain-token')
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
      expect(issueEmailToken).toHaveBeenCalledTimes(1)
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

    it('should escape HTML in the user-supplied name', async () => {
      await sendConfirmationEmail(
        registrationData.email,
        '</h2><a href="https://evil.example">Verify</a>',
        'confirmation-token',
        testOptions,
        'https://app.example.com',
      )

      const mailOptions = mockSendMail.mock.calls[0]?.[0]
      expect(mailOptions.html).not.toContain('<a href="https://evil.example">')
      expect(mailOptions.html).toContain('&lt;/h2&gt;&lt;a href=&quot;https://evil.example&quot;&gt;Verify&lt;/a&gt;')
    })
  })
})
