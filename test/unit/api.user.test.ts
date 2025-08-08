import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ModuleOptions, UserWithoutPassword } from '../../src/types'
import type { H3Event } from 'h3'
import { defaultOptions } from '../../src/module'

// Mock h3 functions
vi.mock('h3', () => ({
  defineEventHandler: vi.fn(handler => handler),
  readBody: vi.fn(),
  createError: vi.fn()
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn()
}))

vi.mock('../../src/runtime/server/utils/user', () => ({
  createUser: vi.fn(),
  findUserById: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn()
}))

// Import the api endpoints after mocking
const userCreateApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/index.post')
const userReadApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/[id].get')
const userUpdateApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/[id].patch')
const userDeleteApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/[id].delete')

describe('User API Routes', () => {
  let testOptions: ModuleOptions
  let regularUser: UserWithoutPassword
  let mockEvent: H3Event
  let mockReadBody: ReturnType<typeof vi.fn>
  let mockCreateError: ReturnType<typeof vi.fn>
  let mockUseRuntimeConfig: ReturnType<typeof vi.fn>
  let mockCreateUser: ReturnType<typeof vi.fn>
  let mockFindUserById: ReturnType<typeof vi.fn>
  let mockUpdateUser: ReturnType<typeof vi.fn>
  let mockDeleteUser: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    const h3 = await import('h3')
    const imports = await import('#imports')
    const utilsUser = await import('../../src/runtime/server/utils/user')

    mockReadBody = h3.readBody as ReturnType<typeof vi.fn>
    mockCreateError = h3.createError as ReturnType<typeof vi.fn>
    mockUseRuntimeConfig = imports.useRuntimeConfig as ReturnType<typeof vi.fn>
    mockCreateUser = utilsUser.createUser as ReturnType<typeof vi.fn>
    mockFindUserById = utilsUser.findUserById as ReturnType<typeof vi.fn>
    mockUpdateUser = utilsUser.updateUser as ReturnType<typeof vi.fn>
    mockDeleteUser = utilsUser.deleteUser as ReturnType<typeof vi.fn>

    testOptions = defaultOptions
    mockUseRuntimeConfig.mockReturnValue({ nuxtUsers: testOptions })

    regularUser = { id: 2, email: 'user@example.com', name: 'User', role: 'user', created_at: '', updated_at: '' }

    mockEvent = { path: '', context: { params: {} } } as H3Event
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/nuxt-users', () => {
    beforeEach(() => {
      // @ts-expect-error - mockEvent is a mock object
      mockEvent.path = '/api/nuxt-users'
    })

    it('should create a user successfully', async () => {
      const newUser = { email: 'new@example.com', name: 'New User', password: 'password123' }
      mockReadBody.mockResolvedValue(newUser)
      mockCreateUser.mockResolvedValue({ id: 3, ...newUser, role: 'user', created_at: '', updated_at: '' })

      const response = await userCreateApiEndpoint.default(mockEvent)

      expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
      expect(mockCreateUser).toHaveBeenCalledWith(newUser, testOptions)
      expect(response.user.email).toBe(newUser.email)
    })

    it('should return 400 for missing required fields', async () => {
      const invalidUser = { email: 'new@example.com' } // missing name and password
      mockReadBody.mockResolvedValue(invalidUser)
      mockCreateError.mockImplementation((e) => {
        throw e
      })

      await expect(userCreateApiEndpoint.default(mockEvent)).rejects.toEqual({
        statusCode: 400,
        statusMessage: 'Missing required fields: email, name, password'
      })
    })
  })

  describe('GET /api/nuxt-users/:id', () => {
    beforeEach(() => {
      // @ts-expect-error - mockEvent is a mock object
      mockEvent.path = '/api/nuxt-users/2'
      mockEvent.context.params = { id: '2' }
    })

    it('should return user by ID', async () => {
      mockFindUserById.mockResolvedValue(regularUser)

      const response = await userReadApiEndpoint.default(mockEvent)

      expect(mockFindUserById).toHaveBeenCalledWith(2, testOptions)
      expect(response.user.id).toBe(2)
    })

    it('should return 400 for invalid user ID', async () => {
      mockEvent.context.params = { id: 'invalid' }
      mockCreateError.mockImplementation((e) => {
        throw e
      })

      await expect(userReadApiEndpoint.default(mockEvent)).rejects.toEqual({
        statusCode: 400,
        statusMessage: 'Invalid user ID'
      })
    })

    it('should return 404 when user not found', async () => {
      // Mock findUserById to return null (user not found)
      mockFindUserById.mockResolvedValue(null)

      await expect(userReadApiEndpoint.default(mockEvent)).rejects.toEqual({
        statusCode: 404,
        statusMessage: 'User not found'
      })

      // Verify the mock was called correctly
      expect(mockFindUserById).toHaveBeenCalledWith(2, testOptions)
    })
  })

  describe('PATCH /api/nuxt-users/:id', () => {
    beforeEach(() => {
      // @ts-expect-error - mockEvent is a mock object
      mockEvent.path = '/api/nuxt-users/2'
      mockEvent.context.params = { id: '2' }
    })

    it('should update user successfully', async () => {
      const updates = { name: 'Updated Name' }
      mockReadBody.mockResolvedValue(updates)
      mockUpdateUser.mockResolvedValue({ ...regularUser, ...updates })

      const response = await userUpdateApiEndpoint.default(mockEvent)

      expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
      expect(mockUpdateUser).toHaveBeenCalledWith(2, updates, testOptions)
      expect(response.user.name).toBe('Updated Name')
    })

    it('should return 400 for invalid user ID', async () => {
      mockEvent.context.params = { id: 'invalid' }
      mockCreateError.mockImplementation((e) => {
        throw e
      })

      await expect(userUpdateApiEndpoint.default(mockEvent)).rejects.toEqual({
        statusCode: 400,
        statusMessage: 'Invalid user ID'
      })
    })
  })

  describe('DELETE /api/nuxt-users/:id', () => {
    beforeEach(() => {
      // @ts-expect-error - mockEvent is a mock object
      mockEvent.path = '/api/nuxt-users/2'
      mockEvent.context.params = { id: '2' }
    })

    it('should delete user successfully', async () => {
      mockDeleteUser.mockResolvedValue(undefined)

      const response = await userDeleteApiEndpoint.default(mockEvent)

      expect(mockDeleteUser).toHaveBeenCalledWith(2, testOptions)
      expect(response.success).toBe(true)
    })

    it('should return 400 for invalid user ID', async () => {
      mockEvent.context.params = { id: 'invalid' }
      mockCreateError.mockImplementation((e) => {
        throw e
      })

      await expect(userDeleteApiEndpoint.default(mockEvent)).rejects.toEqual({
        statusCode: 400,
        statusMessage: 'Invalid user ID'
      })
    })
  })
})
