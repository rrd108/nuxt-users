import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { H3Event } from 'h3'

const mockUseRuntimeConfig = vi.fn()
const mockDefineEventHandler = vi.fn(handler => handler)
const mockGetCookie = vi.fn()
const mockCreateError = vi.fn()
const mockSendRedirect = vi.fn()

vi.mock('h3', () => ({
  defineEventHandler: mockDefineEventHandler,
  getCookie: mockGetCookie,
  createError: mockCreateError,
  sendRedirect: mockSendRedirect
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: mockUseRuntimeConfig
}))

// Import middleware after mocking
const serverAuthMiddleware = await import('../../src/runtime/server/middleware/authorization.server')

vi.mock('../../src/runtime/server/utils', () => ({
  getCurrentUserFromToken: vi.fn(),
  handleUnauthenticatedRequest: vi.fn(),
  handleUnauthorizedRequest: vi.fn(),
  handleInvalidToken: vi.fn()
}))

describe('Auth Server Middleware', () => {
  let mockOptions: { auth: { whitelist: string[], permissions: Record<string, string[]> } }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock runtime config
    mockOptions = {
      auth: {
        whitelist: ['/register'],
        permissions: {
          user: ['/profile', '/api/nuxt-users/me']
        }
      }
    }
    mockUseRuntimeConfig.mockReturnValue({
      nuxtUsers: mockOptions
    })

    // Mock defineEventHandler to return the handler function
    mockDefineEventHandler.mockImplementation(handler => handler)
  })

  describe('Basic Authentication', () => {
    it('should allow favicon.ico requests without authentication', async () => {
      const event = { path: '/favicon.ico', method: 'GET' } as H3Event
      const result = await serverAuthMiddleware.default(event)

      expect(result).toBeUndefined()
      expect(mockGetCookie).not.toHaveBeenCalled()
      expect(mockSendRedirect).not.toHaveBeenCalled()
    })

    it('should allow login requests without authentication', async () => {
      const event = { path: '/login', method: 'GET' } as H3Event
      const result = await serverAuthMiddleware.default(event)

      expect(result).toBeUndefined()
      expect(mockGetCookie).not.toHaveBeenCalled()
      expect(mockSendRedirect).not.toHaveBeenCalled()
    })

    it('should allow api login requests without authentication', async () => {
      const event = { path: '/api/nuxt-users/session', method: 'POST' } as H3Event
      const result = await serverAuthMiddleware.default(event)

      expect(result).toBeUndefined()
      expect(mockGetCookie).not.toHaveBeenCalled()
      expect(mockSendRedirect).not.toHaveBeenCalled()
    })

    it('should allow Nitro task requests without authentication', async () => {
      const event = { path: '/_nitro/tasks', method: 'GET' } as H3Event
      const result = await serverAuthMiddleware.default(event)

      expect(result).toBeUndefined()
      expect(mockGetCookie).not.toHaveBeenCalled()
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(mockSendRedirect).not.toHaveBeenCalled()
    })

    it('should allow the whitelisted /register route', async () => {
      const event = { path: '/register', method: 'GET' } as H3Event
      const result = await serverAuthMiddleware.default(event)

      expect(result).toBeUndefined()
      expect(mockGetCookie).not.toHaveBeenCalled()
      expect(mockSendRedirect).not.toHaveBeenCalled()
    })

    it('should let client handle /profile with no token', async () => {
      const event = { path: '/profile', method: 'GET' } as H3Event

      // Mock getCookie to return no token
      mockGetCookie.mockReturnValue(undefined)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should let client handle /profile with invalid token', async () => {
      const event = { path: '/profile', method: 'GET' } as H3Event

      // Mock getCookie to return an invalid token
      mockGetCookie.mockReturnValue('invalid-token')

      // Mock getCurrentUserFromToken to return null (invalid user)
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(null)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('invalid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should let client handle /profile with invalid user', async () => {
      const event = { path: '/profile', method: 'GET' } as H3Event

      // Mock getCookie to return a token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return null (invalid user)
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(null)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should allow access to /profile with proper auth', async () => {
      const event = { path: '/profile', method: 'GET' } as H3Event

      // Mock getCookie to return a valid token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return a valid user
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      }
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should reject API request with no token', async () => {
      const event = { path: '/api/nuxt-users/me', method: 'GET' } as H3Event

      // Mock getCookie to return no token
      mockGetCookie.mockReturnValue(undefined)

      // Mock createError to return an error object
      const mockError = new Error('Unauthorized')
      mockCreateError.mockReturnValue(mockError)

      // Configure handleUnauthenticatedRequest to call createError and throw
      const { handleUnauthenticatedRequest } = await import('../../src/runtime/server/utils')
      vi.mocked(handleUnauthenticatedRequest).mockImplementation((event, isApiRoute, _isMeEndpoint) => {
        if (isApiRoute) {
          const error = mockCreateError({ statusCode: 401, statusMessage: 'Unauthorized' })
          throw error
        }
      })

      await expect(serverAuthMiddleware.default(event)).rejects.toThrow('Unauthorized')

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(handleUnauthenticatedRequest).toHaveBeenCalledWith(event, true, true)
      expect(mockCreateError).toHaveBeenCalledWith({ statusCode: 401, statusMessage: 'Unauthorized' })
    })

    it('should reject API request with invalid token', async () => {
      const event = { path: '/api/nuxt-users/me', method: 'GET' } as H3Event

      // Mock getCookie to return an invalid token
      mockGetCookie.mockReturnValue('invalid-token')

      // Mock getCurrentUserFromToken to return null (invalid user)
      const { getCurrentUserFromToken, handleInvalidToken } = await import('../../src/runtime/server/utils')
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(null)

      // Mock createError to return an error object
      const mockError = new Error('Unauthorized')
      mockCreateError.mockReturnValue(mockError)

      // Configure handleInvalidToken to call createError and throw
      vi.mocked(handleInvalidToken).mockImplementation((event, isApiRoute, _isMeEndpoint) => {
        if (isApiRoute) {
          const error = mockCreateError({ statusCode: 401, statusMessage: 'Unauthorized' })
          throw error
        }
      })

      await expect(serverAuthMiddleware.default(event)).rejects.toThrow('Unauthorized')

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('invalid-token', mockOptions)
      expect(handleInvalidToken).toHaveBeenCalledWith(event, true, true)
      expect(mockCreateError).toHaveBeenCalledWith({ statusCode: 401, statusMessage: 'Unauthorized' })
    })

    it('should reject API request with insufficient permissions', async () => {
      const event = { path: '/api/admin/users', method: 'GET' } as H3Event

      // Mock getCookie to return a valid token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return a regular user
      const { getCurrentUserFromToken, handleUnauthorizedRequest } = await import('../../src/runtime/server/utils')
      const mockUser = {
        id: 2,
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      }
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

      // Mock createError to return an error object
      const mockError = new Error('Forbidden')
      mockCreateError.mockReturnValue(mockError)

      // Configure handleUnauthorizedRequest to call createError and throw
      vi.mocked(handleUnauthorizedRequest).mockImplementation((event, user, isApiRoute) => {
        if (isApiRoute) {
          const error = mockCreateError({ statusCode: 403, statusMessage: 'Forbidden' })
          throw error
        }
      })

      await expect(serverAuthMiddleware.default(event)).rejects.toThrow('Forbidden')

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(handleUnauthorizedRequest).toHaveBeenCalledWith(event, mockUser, true)
      expect(mockCreateError).toHaveBeenCalledWith({ statusCode: 403, statusMessage: 'Forbidden' })
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
            user: ['/profile', '/api/nuxt-users/me'],
            moderator: ['/admin/*', '/api/admin/*', '/moderate/*']
          }
        }
      }
      mockUseRuntimeConfig.mockReturnValue({
        nuxtUsers: mockOptions
      })
    })

    it('should allow admin to access any path', async () => {
      const event = { path: '/admin/dashboard', method: 'GET' } as H3Event

      // Mock getCookie to return a valid token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return an admin user
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      const mockUser = {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      }
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should allow user to access their permitted paths', async () => {
      const event = { path: '/profile', method: 'GET' } as H3Event

      // Mock getCookie to return a valid token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return a regular user
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      const mockUser = {
        id: 2,
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      }
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should let client handle user access to admin paths', async () => {
      const event = { path: '/admin/dashboard', method: 'GET' } as H3Event

      // Mock getCookie to return a valid token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return a regular user
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      const mockUser = {
        id: 2,
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      }
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should allow moderator to access admin and moderate paths', async () => {
      const event = { path: '/admin/users', method: 'GET' } as H3Event

      // Mock getCookie to return a valid token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return a moderator user
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      const mockUser = {
        id: 3,
        email: 'moderator@example.com',
        name: 'Moderator User',
        role: 'moderator',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      }
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should let client handle moderator access to user-specific paths', async () => {
      const event = { path: '/profile', method: 'GET' } as H3Event

      // Mock getCookie to return a valid token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return a moderator user
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      const mockUser = {
        id: 3,
        email: 'moderator@example.com',
        name: 'Moderator User',
        role: 'moderator',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      }
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should let client handle access when user role is not found in permissions', async () => {
      const event = { path: '/profile', method: 'GET' } as H3Event

      // Mock getCookie to return a valid token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return a user with unknown role
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      const mockUser = {
        id: 4,
        email: 'unknown@example.com',
        name: 'Unknown User',
        role: 'unknown',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      }
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should let client handle access when no permissions are configured (whitelist approach)', async () => {
      const event = { path: '/profile', method: 'GET' } as H3Event

      // Mock runtime config with no permissions
      mockOptions = {
        auth: {
          whitelist: ['/register'],
          permissions: {}
        }
      }
      mockUseRuntimeConfig.mockReturnValue({
        nuxtUsers: mockOptions
      })

      // Mock getCookie to return a valid token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return a user
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      }
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should handle API routes with role-based permissions', async () => {
      const event = { path: '/api/admin/users', method: 'GET' } as H3Event

      // Mock getCookie to return a valid token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return a moderator user
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      const mockUser = {
        id: 3,
        email: 'moderator@example.com',
        name: 'Moderator User',
        role: 'moderator',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      }
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should auto-whitelist /me endpoint for any authenticated user', async () => {
      const event = { path: '/api/nuxt-users/me', method: 'GET', context: {} } as H3Event

      // Mock getCookie to return a valid token
      mockGetCookie.mockReturnValue('valid-token')

      // Mock getCurrentUserFromToken to return a user with unknown role (not in permissions)
      const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
      const mockUser = {
        id: 5,
        email: 'unknown@example.com',
        name: 'Unknown Role User',
        role: 'unknown', // This role is not in permissions but /me should still work
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      }
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

      const result = await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
      expect(mockCreateError).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })

  describe('Query strings and dots in the path', () => {
    const regularUser = {
      id: 2,
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      active: true
    }

    beforeEach(async () => {
      const { handleUnauthenticatedRequest } = await import('../../src/runtime/server/utils')
      vi.mocked(handleUnauthenticatedRequest).mockImplementation((_event, isApiRoute) => {
        if (isApiRoute) {
          throw new Error('Unauthorized')
        }
      })
    })

    it.each([
      ['POST', '/api/nuxt-users?x=a.b'],
      ['POST', '/api/nuxt-users?.'],
      ['PATCH', '/api/nuxt-users/1?x=.'],
      ['DELETE', '/api/nuxt-users/1?x=.'],
      ['GET', '/api/nuxt-users/1?file=a.json'],
      ['GET', '/api/admin/customers?x=.'],
    ])('should require authentication for %s %s (dot in query string)', async (method, path) => {
      const event = { path, method } as H3Event
      mockGetCookie.mockReturnValue(undefined)

      await expect(serverAuthMiddleware.default(event)).rejects.toThrow('Unauthorized')

      const { handleUnauthenticatedRequest } = await import('../../src/runtime/server/utils')
      expect(handleUnauthenticatedRequest).toHaveBeenCalledWith(event, true, false)
    })

    it('should require authentication for API paths with a dot in the pathname', async () => {
      const event = { path: '/api/admin/files/report.pdf', method: 'GET' } as H3Event
      mockGetCookie.mockReturnValue(undefined)

      await expect(serverAuthMiddleware.default(event)).rejects.toThrow('Unauthorized')
    })

    it('should require authentication for page routes with a dot only in the query string', async () => {
      const event = { path: '/admin/users?x=a.b', method: 'GET' } as H3Event
      mockGetCookie.mockReturnValue(undefined)

      await serverAuthMiddleware.default(event)

      expect(mockGetCookie).toHaveBeenCalledWith(event, 'auth_token')
      const { handleUnauthenticatedRequest } = await import('../../src/runtime/server/utils')
      expect(handleUnauthenticatedRequest).toHaveBeenCalledWith(event, false, false)
    })

    it('should still skip static files outside /api', async () => {
      const event = { path: '/images/logo.png?v=2', method: 'GET' } as H3Event

      const result = await serverAuthMiddleware.default(event)

      expect(result).toBeUndefined()
      expect(mockGetCookie).not.toHaveBeenCalled()
    })

    it('should treat /me with a query string as the /me endpoint', async () => {
      const event = { path: '/api/nuxt-users/me?x=1', method: 'GET' } as H3Event
      mockGetCookie.mockReturnValue(undefined)

      await expect(serverAuthMiddleware.default(event)).rejects.toThrow('Unauthorized')

      const { handleUnauthenticatedRequest } = await import('../../src/runtime/server/utils')
      expect(handleUnauthenticatedRequest).toHaveBeenCalledWith(event, true, true)
    })

    it('should allow public API endpoints with a query string', async () => {
      const event = { path: '/api/nuxt-users/session?redirect=/home', method: 'POST' } as H3Event

      const result = await serverAuthMiddleware.default(event)

      expect(result).toBeUndefined()
      expect(mockGetCookie).not.toHaveBeenCalled()
    })

    it('should match permissions against the path without the query string', async () => {
      const event = { path: '/api/nuxt-users/me?x=1', method: 'PATCH', context: {} } as H3Event
      mockGetCookie.mockReturnValue('valid-token')
      const { getCurrentUserFromToken, handleUnauthorizedRequest } = await import('../../src/runtime/server/utils')
      vi.mocked(getCurrentUserFromToken).mockResolvedValue(regularUser)

      const result = await serverAuthMiddleware.default(event)

      expect(result).toBeUndefined()
      expect(handleUnauthorizedRequest).not.toHaveBeenCalled()
    })

    it('should require authentication for module endpoints under a custom apiBasePath outside /api', async () => {
      mockUseRuntimeConfig.mockReturnValue({ nuxtUsers: { ...mockOptions, apiBasePath: '/auth-api' } })
      const event = { path: '/auth-api?x=.', method: 'POST' } as H3Event
      mockGetCookie.mockReturnValue(undefined)

      await expect(serverAuthMiddleware.default(event)).rejects.toThrow('Unauthorized')
    })

    it('should not let a query string satisfy a whitelist entry', async () => {
      const event = { path: '/api/nuxt-users?/register', method: 'POST' } as H3Event
      mockGetCookie.mockReturnValue(undefined)

      await expect(serverAuthMiddleware.default(event)).rejects.toThrow('Unauthorized')
    })
  })
})
