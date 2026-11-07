import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { H3Event } from 'h3'
import type { UserWithoutPassword } from '../../src/types'
import { defaultOptions } from '../../src/module'

vi.mock('h3', () => ({
  defineEventHandler: vi.fn(handler => handler),
  readBody: vi.fn(),
  createError: vi.fn((e) => {
    throw e
  })
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn(() => ({ nuxtUsers: defaultOptions }))
}))

vi.mock('../../src/runtime/server/utils', () => ({
  updateUser: vi.fn()
}))

const meUpdateApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/me.patch')

describe('PATCH /api/nuxt-users/me', () => {
  const user: UserWithoutPassword = { id: 7, email: 'me@example.com', name: 'Me', role: 'user', created_at: '', updated_at: '', active: true }
  let mockReadBody: ReturnType<typeof vi.fn>
  let mockUpdateUser: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const h3 = await import('h3')
    const utils = await import('../../src/runtime/server/utils')
    mockReadBody = h3.readBody as ReturnType<typeof vi.fn>
    mockUpdateUser = utils.updateUser as ReturnType<typeof vi.fn>
    mockUpdateUser.mockImplementation(async (_id, body) => ({ ...user, ...body }))
  })

  it('updates the user stored in context by the authorization middleware', async () => {
    mockReadBody.mockResolvedValue({ name: 'New Name' })
    const event = { context: { nuxtUsers: { user } } } as unknown as H3Event

    const response = await meUpdateApiEndpoint.default(event)

    expect(mockUpdateUser).toHaveBeenCalledWith(7, { name: 'New Name' }, defaultOptions)
    expect(response.user.name).toBe('New Name')
  })

  it('strips role and active, including falsy values', async () => {
    mockReadBody.mockResolvedValue({ name: 'X', role: 'admin', active: false })
    const event = { context: { nuxtUsers: { user } } } as unknown as H3Event

    await meUpdateApiEndpoint.default(event)

    expect(mockUpdateUser).toHaveBeenCalledWith(7, { name: 'X' }, defaultOptions)
  })

  it('returns 401 without an authenticated user', async () => {
    mockReadBody.mockResolvedValue({ name: 'X' })
    const event = { context: {} } as unknown as H3Event

    await expect(meUpdateApiEndpoint.default(event)).rejects.toMatchObject({ statusCode: 401 })
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })
})
