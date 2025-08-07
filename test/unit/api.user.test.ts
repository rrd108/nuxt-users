import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ModuleOptions, User, UserWithoutPassword } from '../../src/types'
import type { H3Event } from 'h3'
import crypto from 'node:crypto'
import { defaultOptions } from '../../src/module'

// Mock h3 functions
vi.mock('h3', () => ({
  defineEventHandler: vi.fn(handler => handler),
  getCookie: vi.fn(),
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
  deleteUser: vi.fn(),
  getCurrentUserFromToken: vi.fn()
}))

vi.mock('../../src/runtime/utils/permissions', () => ({
  hasPermission: vi.fn()
}))

// Import the api endpoints after mocking
const userCreateApiEndpoint = await import('../../src/runtime/server/api/user/index.post')
const userReadApiEndpoint = await import('../../src/runtime/server/api/user/[id]/index.get')
const userUpdateApiEndpoint = await import('../../src/runtime/server/api/user/[id]/index.patch')
const userDeleteApiEndpoint = await import('../../src/runtime/server/api/user/[id]/index.delete')

describe('User API Routes', () => {
  let testOptions: ModuleOptions
  let adminUser: UserWithoutPassword
  let regularUser: UserWithoutPassword
  let mockEvent: H3Event
  let mockGetCookie: ReturnType<typeof vi.fn>
  let mockReadBody: ReturnType<typeof vi.fn>
  let mockCreateError: ReturnType<typeof vi.fn>
  let mockUseRuntimeConfig: ReturnType<typeof vi.fn>
  let mockGetCurrentUserFromToken: ReturnType<typeof vi.fn>
  let mockCreateUser: ReturnType<typeof vi.fn>
  let mockFindUserById: ReturnType<typeof vi.fn>
  let mockUpdateUser: ReturnType<typeof vi.fn>
  let mockDeleteUser: ReturnType<typeof vi.fn>
  let mockHasPermission: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    const h3 = await import('h3')
    const imports = await import('#imports')
    const utilsUser = await import('../../src/runtime/server/utils/user')
    const utilsPermissions = await import('../../src/runtime/utils/permissions')

    mockGetCookie = h3.getCookie as ReturnType<typeof vi.fn>
    mockReadBody = h3.readBody as ReturnType<typeof vi.fn>
    mockCreateError = h3.createError as ReturnType<typeof vi.fn>
    mockUseRuntimeConfig = imports.useRuntimeConfig as ReturnType<typeof vi.fn>
    mockGetCurrentUserFromToken = utilsUser.getCurrentUserFromToken as ReturnType<typeof vi.fn>
    mockCreateUser = utilsUser.createUser as ReturnType<typeof vi.fn>
    mockFindUserById = utilsUser.findUserById as ReturnType<typeof vi.fn>
    mockUpdateUser = utilsUser.updateUser as ReturnType<typeof vi.fn>
    mockDeleteUser = utilsUser.deleteUser as ReturnType<typeof vi.fn>
    mockHasPermission = utilsPermissions.hasPermission as ReturnType<typeof vi.fn>

    testOptions = defaultOptions
    mockUseRuntimeConfig.mockReturnValue({ nuxtUsers: testOptions })

    adminUser = { id: 1, email: 'admin@example.com', name: 'Admin', role: 'admin', created_at: '', updated_at: '' }
    regularUser = { id: 2, email: 'user@example.com', name: 'User', role: 'user', created_at: '', updated_at: '' }

    mockEvent = { path: '', context: { params: {} } } as H3Event
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // --- Create User (POST /api/user) ---
  describe('POST /api/user', () => {
    beforeEach(() => {
      mockEvent.path = '/api/user'
    })

    it('should create a user when called by an admin', async () => {
      const newUser = { email: 'new@example.com', name: 'New User', password: 'password123' }
      mockGetCookie.mockReturnValue('admin-token')
      mockGetCurrentUserFromToken.mockResolvedValue(adminUser)
      mockHasPermission.mockReturnValue(true)
      mockReadBody.mockResolvedValue(newUser)
      mockCreateUser.mockResolvedValue({ id: 3, ...newUser, role: 'user', created_at: '', updated_at: '' })

      const response = await userCreateApiEndpoint.default(mockEvent)

      expect(mockGetCurrentUserFromToken).toHaveBeenCalledWith('admin-token', testOptions)
      expect(mockHasPermission).toHaveBeenCalledWith('admin', '/api/user', testOptions.auth.permissions)
      expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
      expect(mockCreateUser).toHaveBeenCalledWith(newUser, testOptions)
      expect(response.user.email).toBe(newUser.email)
    })

    it('should return 403 if a non-admin tries to create a user', async () => {
      mockGetCookie.mockReturnValue('user-token')
      mockGetCurrentUserFromToken.mockResolvedValue(regularUser)
      mockHasPermission.mockReturnValue(false)
      mockCreateError.mockImplementation(e => { throw e })

      await expect(userCreateApiEndpoint.default(mockEvent)).rejects.toEqual({
        statusCode: 403,
        statusMessage: 'Forbidden'
      })
    })
  })

  // --- Read User (GET /api/user/:id) ---
  describe('GET /api/user/:id', () => {
    beforeEach(() => {
      mockEvent.path = '/api/user/2'
      mockEvent.context.params = { id: '2' }
    })

    it('should allow an admin to read any user', async () => {
      mockGetCookie.mockReturnValue('admin-token')
      mockGetCurrentUserFromToken.mockResolvedValue(adminUser)
      mockHasPermission.mockReturnValue(true)
      mockFindUserById.mockResolvedValue(regularUser)

      const response = await userReadApiEndpoint.default(mockEvent)

      expect(mockFindUserById).toHaveBeenCalledWith(2, testOptions)
      expect(response.user.id).toBe(2)
    })

    it('should allow a user to read their own profile', async () => {
      mockGetCookie.mockReturnValue('user-token')
      mockGetCurrentUserFromToken.mockResolvedValue(regularUser)
      mockHasPermission.mockReturnValue(false) // Not an admin
      mockFindUserById.mockResolvedValue(regularUser)

      const response = await userReadApiEndpoint.default(mockEvent)

      expect(response.user.id).toBe(2)
    })

    it('should return 403 if a user tries to read another user profile', async () => {
        mockEvent.path = '/api/user/1'
        mockEvent.context.params = { id: '1' } // trying to read admin profile
        mockGetCookie.mockReturnValue('user-token')
        mockGetCurrentUserFromToken.mockResolvedValue(regularUser)
        mockHasPermission.mockReturnValue(false)
        mockCreateError.mockImplementation(e => { throw e })

        await expect(userReadApiEndpoint.default(mockEvent)).rejects.toEqual({
            statusCode: 403,
            statusMessage: 'Forbidden'
        })
    })
  })

  // --- Update User (PATCH /api/user/:id) ---
  describe('PATCH /api/user/:id', () => {
    beforeEach(() => {
        mockEvent.path = '/api/user/2'
        mockEvent.context.params = { id: '2' }
    })

    it('should allow an admin to update a user', async () => {
        const updates = { name: 'Updated Name' }
        mockGetCookie.mockReturnValue('admin-token')
        mockGetCurrentUserFromToken.mockResolvedValue(adminUser)
        mockHasPermission.mockReturnValue(true)
        mockReadBody.mockResolvedValue(updates)
        mockUpdateUser.mockResolvedValue({ ...regularUser, ...updates })

        const response = await userUpdateApiEndpoint.default(mockEvent)

        expect(mockUpdateUser).toHaveBeenCalledWith(2, updates, testOptions)
        expect(response.user.name).toBe('Updated Name')
    })

    it('should return 403 if a non-admin tries to update a user', async () => {
        mockGetCookie.mockReturnValue('user-token')
        mockGetCurrentUserFromToken.mockResolvedValue(regularUser)
        mockHasPermission.mockReturnValue(false)
        mockCreateError.mockImplementation(e => { throw e })

        await expect(userUpdateApiEndpoint.default(mockEvent)).rejects.toEqual({
            statusCode: 403,
            statusMessage: 'Forbidden'
        })
    })
  })

  // --- Delete User (DELETE /api/user/:id) ---
  describe('DELETE /api/user/:id', () => {
    beforeEach(() => {
        mockEvent.path = '/api/user/2'
        mockEvent.context.params = { id: '2' }
    })

    it('should allow an admin to delete a user', async () => {
        mockGetCookie.mockReturnValue('admin-token')
        mockGetCurrentUserFromToken.mockResolvedValue(adminUser)
        mockHasPermission.mockReturnValue(true)
        mockDeleteUser.mockResolvedValue(undefined)

        const response = await userDeleteApiEndpoint.default(mockEvent)

        expect(mockDeleteUser).toHaveBeenCalledWith(2, testOptions)
        expect(response.success).toBe(true)
    })

    it('should return 403 if a non-admin tries to delete a user', async () => {
        mockGetCookie.mockReturnValue('user-token')
        mockGetCurrentUserFromToken.mockResolvedValue(regularUser)
        mockHasPermission.mockReturnValue(false)
        mockCreateError.mockImplementation(e => { throw e })

        await expect(userDeleteApiEndpoint.default(mockEvent)).rejects.toEqual({
            statusCode: 403,
            statusMessage: 'Forbidden'
        })
    })
  })
})
