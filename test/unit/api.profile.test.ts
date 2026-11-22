import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { UserWithoutPassword, User } from '../../src/types'
import type { H3Event } from 'h3'
import { defaultOptions } from '../../src/module'

// Reading the session itself is covered against a real database in test/auth-session.test.ts
vi.mock('h3', () => ({
  defineEventHandler: vi.fn(handler => handler),
  createError: vi.fn((error) => {
    throw error
  }),
  readBody: vi.fn()
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn(() => ({ nuxtUsers: defaultOptions }))
}))

vi.mock('../../src/runtime/server/utils', () => ({
  requireSessionUser: vi.fn(),
  findUserById: vi.fn(),
  updateUserPassword: vi.fn(),
  endOtherSessions: vi.fn()
}))

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn()
  }
}))

vi.mock('../../src/utils', () => ({
  validatePassword: vi.fn(() => ({ isValid: true, errors: [] })),
  getPasswordValidationOptions: vi.fn(() => ({}))
}))

const profileApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/me.get')
const passwordChangeApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/password/index.patch')
const utils = await import('../../src/runtime/server/utils')
const h3 = await import('h3')
const bcrypt = await import('bcrypt')

const testUser: UserWithoutPassword = {
  id: 1,
  email: 'profile@example.com',
  name: 'Profile Test User',
  role: 'user',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  active: true
}
const testUserWithPassword: User = { ...testUser, password: '$2a$10$hashedPasswordHere' }
const unauthorized = { statusCode: 401, statusMessage: 'Unauthorized - No authentication token found' }
const event = {} as H3Event

describe('Profile API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the session user, without a password', async () => {
    vi.mocked(utils.requireSessionUser).mockResolvedValue(testUser)

    const response = await profileApiEndpoint.default(event)

    expect(utils.requireSessionUser).toHaveBeenCalledWith(event, defaultOptions)
    expect(response.user).toEqual(testUser)
    expect('password' in response.user).toBe(false)
  })

  it('answers 401 without a valid session', async () => {
    vi.mocked(utils.requireSessionUser).mockRejectedValue(unauthorized)

    await expect(profileApiEndpoint.default(event)).rejects.toMatchObject({ statusCode: 401 })
  })
})

describe('Password Change API Route', () => {
  const currentPassword = 'OldPassword123'
  const newPassword = 'NewPassword123'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(utils.requireSessionUser).mockResolvedValue(testUser)
    vi.mocked(utils.findUserById).mockResolvedValue(testUserWithPassword as never)
    vi.mocked(h3.readBody).mockResolvedValue({ currentPassword, newPassword, newPasswordConfirmation: newPassword })
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never)
  })

  it('changes the password and ends the other sessions, keeping the current one', async () => {
    const response = await passwordChangeApiEndpoint.default(event)

    expect(utils.findUserById).toHaveBeenCalledWith(testUser.id, defaultOptions, true)
    expect(bcrypt.default.compare).toHaveBeenCalledWith(currentPassword, testUserWithPassword.password)
    expect(utils.updateUserPassword).toHaveBeenCalledWith(testUser.email, newPassword, defaultOptions)
    expect(utils.endOtherSessions).toHaveBeenCalledWith(event, testUser.id, defaultOptions)
    expect(response.message).toBe('Password updated successfully')
  })

  it('answers 401 without a valid session', async () => {
    vi.mocked(utils.requireSessionUser).mockRejectedValue(unauthorized)

    await expect(passwordChangeApiEndpoint.default(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(utils.updateUserPassword).not.toHaveBeenCalled()
  })

  it('rejects a wrong current password', async () => {
    vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never)

    await expect(passwordChangeApiEndpoint.default(event)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'Current password is incorrect' })
    expect(utils.updateUserPassword).not.toHaveBeenCalled()
    expect(utils.endOtherSessions).not.toHaveBeenCalled()
  })
})
