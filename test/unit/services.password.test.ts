import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ModuleOptions, User } from '../../src/types'
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
    findUserByEmail: vi.fn(),
  }
})

// The email token module and the reset itself are tested against a real database
// (test/email-token.test.ts, test/email-token.flows.test.ts); these tests cover the email
vi.mock('../../src/runtime/server/utils/email-token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/runtime/server/utils/email-token')>()
  return {
    ...actual,
    issueEmailToken: vi.fn(),
  }
})

const { sendPasswordResetLink } = await import('../../src/runtime/server/services/password')
const { findUserByEmail } = await import('../../src/runtime/server/utils')
const { issueEmailToken } = await import('../../src/runtime/server/utils/email-token')

const testUser: User = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed-password',
  role: 'user',
  active: true,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

describe('Password Service', () => {
  let testOptions: ModuleOptions

  beforeEach(() => {
    vi.clearAllMocks()

    testOptions = {
      ...defaultOptions,
    }

    vi.mocked(findUserByEmail).mockResolvedValue(testUser)
    vi.mocked(issueEmailToken).mockResolvedValue('plain-token')
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })
  })

  describe('sendPasswordResetLink', () => {
    it('should return silently when the email does not belong to a user', async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null)

      await expect(
        sendPasswordResetLink('missing@example.com', testOptions, 'https://app.example.com'),
      ).resolves.toBeUndefined()

      expect(issueEmailToken).not.toHaveBeenCalled()
      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('should return silently for a user who is not active', async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({ ...testUser, active: false })

      await expect(
        sendPasswordResetLink('test@example.com', testOptions, 'https://app.example.com'),
      ).resolves.toBeUndefined()

      expect(issueEmailToken).not.toHaveBeenCalled()
      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('should issue a password reset token and email the link to existing users', async () => {
      await sendPasswordResetLink('test@example.com', testOptions, 'https://app.example.com')

      expect(issueEmailToken).toHaveBeenCalledWith('test@example.com', 'password_reset', testOptions)
      expect(mockSendMail).toHaveBeenCalledTimes(1)

      const mailOptions = mockSendMail.mock.calls[0]?.[0]
      expect(mailOptions.to).toBe('test@example.com')
      expect(mailOptions.html).toContain('https://app.example.com/reset-password?')
      expect(mailOptions.html).toContain('email=test%40example.com')
      expect(mailOptions.html).toContain('token=plain-token')
    })

    it('should still issue the token when mailer configuration is missing', async () => {
      await sendPasswordResetLink('test@example.com', {
        ...testOptions,
        mailer: undefined,
      })

      expect(issueEmailToken).toHaveBeenCalledTimes(1)
      expect(mockSendMail).not.toHaveBeenCalled()
    })

    it('should not throw when sending the reset email fails', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP unavailable'))

      await expect(
        sendPasswordResetLink('test@example.com', testOptions, 'https://app.example.com'),
      ).resolves.toBeUndefined()

      expect(mockSendMail).toHaveBeenCalledTimes(1)
    })
  })
})
