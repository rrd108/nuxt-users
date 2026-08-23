import { describe, it, expect, beforeEach, vi } from 'vitest'
import bcrypt from 'bcrypt'
import type { ModuleOptions } from '../../src/types'
import { defaultOptions } from '../../src/module'

vi.mock('../../src/runtime/server/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/runtime/server/utils')>()
  return {
    ...actual,
    useDb: vi.fn(),
    updateUserPassword: vi.fn(),
  }
})

const { resetPassword, deleteExpiredPasswordResetTokens } = await import('../../src/runtime/server/services/password')
const { useDb, updateUserPassword } = await import('../../src/runtime/server/utils')

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
  })

  describe('resetPassword', () => {
    it('should accept created_at as a Date object (MySQL driver behavior)', async () => {
      const plainToken = 'valid-reset-token'
      const hashedToken = await bcrypt.hash(plainToken, 10)

      mockSql
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            email: 'test@example.com',
            token: hashedToken,
            created_at: new Date(),
          }],
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
      const hashedToken = await bcrypt.hash(plainToken, 10)
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

      mockSql
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            email: 'test@example.com',
            token: hashedToken,
            created_at: createdAt,
          }],
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

    it('should reject expired tokens when created_at is a Date object', async () => {
      const plainToken = 'expired-reset-token'
      const hashedToken = await bcrypt.hash(plainToken, 10)
      const createdAt = new Date()
      createdAt.setHours(createdAt.getHours() - 2)

      mockSql
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            email: 'test@example.com',
            token: hashedToken,
            created_at: createdAt,
          }],
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
