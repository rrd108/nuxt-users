import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RouteLocationNormalizedGeneric } from 'vue-router'

const mockUseRuntimeConfig = vi.fn()
const mockDefineNuxtRouteMiddleware = vi.fn(middleware => middleware)
const mockNavigateTo = vi.fn()
const mockuseAuthentication = vi.fn()

vi.mock('#app', () => ({
  useRuntimeConfig: mockUseRuntimeConfig,
  defineNuxtRouteMiddleware: mockDefineNuxtRouteMiddleware,
  navigateTo: mockNavigateTo
}))

vi.mock('../../src/runtime/composables/useAuthentication', () => ({
  useAuthentication: mockuseAuthentication
}))

// Import middleware after mocking
const clientAuthMiddleware = await import('../../src/runtime/middleware/authorization.client')

describe('Auth Client Middleware', () => {
  let mockTo: RouteLocationNormalizedGeneric
  let mockFrom: RouteLocationNormalizedGeneric
  let mockOptions: { auth: { whitelist: string[], permissions: Record<string, string[]> } }
  let mockUser: { value: { id?: number, role?: string } | null }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock runtime config
    mockOptions = {
      auth: {
        whitelist: ['/register'],
        permissions: {
          user: ['/profile', '/api/user/profile']
        }
      }
    }
    mockUseRuntimeConfig.mockReturnValue({
      public: {
        nuxtUsers: mockOptions
      }
    })

    // Mock route objects
    mockTo = {
      path: '/favicon.ico'
    } as RouteLocationNormalizedGeneric

    mockFrom = {
      path: '/'
    } as RouteLocationNormalizedGeneric

    // Mock user
    mockUser = {
      value: null
    }

    // Mock isAuthenticated as a computed property
    const mockIsAuthenticated = {
      value: false
    }

    mockuseAuthentication.mockReturnValue({
      user: mockUser,
      isAuthenticated: mockIsAuthenticated
    })

    // Mock defineNuxtRouteMiddleware to return the middleware function
    mockDefineNuxtRouteMiddleware.mockImplementation(middleware => middleware)
  })

  describe('Basic Authentication', () => {
    it('should allow login requests without authentication', async () => {
      mockTo.path = '/login'

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(result).toBeUndefined()
      expect(mockuseAuthentication).not.toHaveBeenCalled()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('should allow the whitelisted /register route', async () => {
      mockTo.path = '/register'

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(result).toBeUndefined()
      expect(mockuseAuthentication).not.toHaveBeenCalled()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('should deny access to /profile with no user', async () => {
      mockTo.path = '/profile'

      // Mock user with no id and not authenticated
      mockUser.value = null
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: false }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
      expect(result).toBeUndefined()
    })

    it('should deny access to /profile with user without id', async () => {
      mockTo.path = '/profile'

      // Mock user without id and not authenticated
      mockUser.value = { id: undefined }
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: false }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
      expect(result).toBeUndefined()
    })

    it('should allow access to /profile with proper auth', async () => {
      mockTo.path = '/profile'

      // Mock user with valid id and authenticated
      mockUser.value = { id: 1, role: 'user' }
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: true }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })

  describe('Role Based Authorization', () => {
    beforeEach(() => {
      // Update mock options for role-based tests
      mockOptions = {
        auth: {
          whitelist: ['/register'],
          permissions: {
            admin: ['*'],
            user: ['/profile', '/api/user/profile'],
            moderator: ['/admin/*', '/api/admin/*', '/moderate/*']
          }
        }
      }
      mockUseRuntimeConfig.mockReturnValue({
        public: {
          nuxtUsers: mockOptions
        }
      })
    })

    it('should allow admin to access any path', async () => {
      mockTo.path = '/admin/dashboard'

      // Mock user with admin role and authenticated
      mockUser.value = { id: 1, role: 'admin' }
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: true }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should allow user to access their permitted paths', async () => {
      mockTo.path = '/profile'

      // Mock user with user role and authenticated
      mockUser.value = { id: 2, role: 'user' }
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: true }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should deny user access to admin paths', async () => {
      mockTo.path = '/admin/dashboard'

      // Mock user with user role and authenticated
      mockUser.value = { id: 2, role: 'user' }
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: true }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
      expect(result).toBeUndefined()
    })

    it('should allow moderator to access admin and moderate paths', async () => {
      mockTo.path = '/admin/users'

      // Mock user with moderator role and authenticated
      mockUser.value = { id: 3, role: 'moderator' }
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: true }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should deny moderator access to user-specific paths', async () => {
      mockTo.path = '/profile'

      // Mock user with moderator role and authenticated
      mockUser.value = { id: 3, role: 'moderator' }
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: true }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
      expect(result).toBeUndefined()
    })

    it('should deny access when user role is not found in permissions', async () => {
      mockTo.path = '/profile'

      // Mock user with unknown role and authenticated
      mockUser.value = { id: 4, role: 'unknown' }
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: true }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
      expect(result).toBeUndefined()
    })

    it('should deny access when no permissions are configured (whitelist approach)', async () => {
      mockTo.path = '/profile'

      // Mock runtime config with no permissions
      mockOptions = {
        auth: {
          whitelist: ['/register'],
          permissions: {}
        }
      }
      mockUseRuntimeConfig.mockReturnValue({
        public: {
          nuxtUsers: mockOptions
        }
      })

      // Mock user with user role and authenticated
      mockUser.value = { id: 1, role: 'user' }
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: true }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
      expect(result).toBeUndefined()
    })

    it('should handle API routes with role-based permissions', async () => {
      mockTo.path = '/api/admin/users'

      // Mock user with moderator role and authenticated
      mockUser.value = { id: 3, role: 'moderator' }
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: true }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should deny access when user is null', async () => {
      mockTo.path = '/profile'

      // Mock user as null but authenticated
      mockUser.value = null
      mockuseAuthentication.mockReturnValue({
        user: mockUser,
        isAuthenticated: { value: true }
      })

      const result = await clientAuthMiddleware.default(mockTo, mockFrom)

      expect(mockuseAuthentication).toHaveBeenCalled()
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
      expect(result).toBeUndefined()
    })
  })
})
