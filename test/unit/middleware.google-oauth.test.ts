import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ModuleOptions } from '../../src/types'
import { defaultOptions } from '../../src/module'

/**
 * Tests for Client-side Middleware OAuth Flow
 * 
 * Tests the critical client-side authentication flow after OAuth redirect:
 * 1. Detection of oauth_success query parameter
 * 2. User fetching via SSR (useFetch)
 * 3. Client state population
 * 4. Navigation decisions
 */

// Mock dependencies
vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: vi.fn(handler => handler),
  navigateTo: vi.fn(),
  useRuntimeConfig: vi.fn(),
  useFetch: vi.fn()
}))

vi.mock('../../src/runtime/composables/useAuthentication', () => ({
  useAuthentication: vi.fn()
}))

vi.mock('../../src/runtime/utils/permissions', () => ({
  hasPermission: vi.fn(),
  isWhitelisted: vi.fn()
}))

vi.mock('../../src/runtime/constants', () => ({
  NO_AUTH_PATHS: ['/login', '/reset-password'],
  NO_AUTH_API_PATHS: ['/session', '/password/forgot', '/password/reset']
}))

const authorizationMiddleware = await import('../../src/runtime/middleware/authorization.client')

describe('Google OAuth Client Middleware', () => {
  let mockNavigateTo: ReturnType<typeof vi.fn>
  let mockUseRuntimeConfig: ReturnType<typeof vi.fn>
  let mockUseAuthentication: ReturnType<typeof vi.fn>
  let mockUseFetch: ReturnType<typeof vi.fn>
  let mockIsWhitelisted: ReturnType<typeof vi.fn>
  let mockHasPermission: ReturnType<typeof vi.fn>
  let testOptions: ModuleOptions

  beforeEach(async () => {
    vi.clearAllMocks()

    const app = await import('#app')
    const auth = await import('../../src/runtime/composables/useAuthentication')
    const permissions = await import('../../src/runtime/utils/permissions')

    mockNavigateTo = app.navigateTo as ReturnType<typeof vi.fn>
    mockUseRuntimeConfig = app.useRuntimeConfig as ReturnType<typeof vi.fn>
    mockUseFetch = app.useFetch as ReturnType<typeof vi.fn>
    mockUseAuthentication = auth.useAuthentication as ReturnType<typeof vi.fn>
    mockIsWhitelisted = permissions.isWhitelisted as ReturnType<typeof vi.fn>
    mockHasPermission = permissions.hasPermission as ReturnType<typeof vi.fn>

    testOptions = {
      ...defaultOptions,
      auth: {
        ...defaultOptions.auth,
        google: {
          clientId: 'test',
          clientSecret: 'test',
          allowAutoRegistration: false
        }
      }
    }

    mockUseRuntimeConfig.mockReturnValue({
      public: { nuxtUsers: testOptions }
    })

    mockIsWhitelisted.mockReturnValue(false)
    mockHasPermission.mockReturnValue(true)
  })

  describe('OAuth Success Flow', () => {
    it('should fetch user via SSR when oauth_success=true and user not authenticated', async () => {
      const mockFetchUser = vi.fn().mockResolvedValue(undefined)
      
      mockUseAuthentication.mockReturnValue({
        isAuthenticated: { value: false },
        user: { value: null },
        fetchUser: mockFetchUser
      })

      const to = {
        path: '/',
        query: { oauth_success: 'true' }
      }

      const from = { path: '/login' } as any
      await authorizationMiddleware.default(to as any, from)

      // Should call fetchUser with SSR enabled
      expect(mockFetchUser).toHaveBeenCalledWith(true)
    })

    it('should allow access after successful user fetch', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      }

      // Create reactive-like values that change after fetch
      const isAuthenticatedRef = { value: false }
      const userRef = { value: null as any }
      
      const mockFetchUser = vi.fn().mockImplementation(async () => {
        // Simulate successful fetch - update refs
        isAuthenticatedRef.value = true
        userRef.value = mockUser
      })

      mockUseAuthentication.mockReturnValue({
        isAuthenticated: isAuthenticatedRef,
        user: userRef,
        fetchUser: mockFetchUser
      })

      const to = {
        path: '/',
        query: { oauth_success: 'true' }
      }

      const from = { path: '/login' } as any
      await authorizationMiddleware.default(to as any, from)

      expect(mockFetchUser).toHaveBeenCalledWith(true)
      // After fetch, should NOT redirect to login
      expect(mockNavigateTo).not.toHaveBeenCalledWith('/login')
    })

    it('should handle fetch user failure gracefully', async () => {
      const mockFetchUser = vi.fn().mockRejectedValue(new Error('Network error'))

      mockUseAuthentication.mockReturnValue({
        isAuthenticated: { value: false },
        user: { value: null },
        fetchUser: mockFetchUser
      })

      const to = {
        path: '/',
        query: { oauth_success: 'true' }
      }

      const from = { path: '/login' } as any
      await authorizationMiddleware.default(to as any, from)

      expect(mockFetchUser).toHaveBeenCalledWith(true)
      // After failed fetch, should redirect to login
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })

    it('should not fetch user if already authenticated', async () => {
      const mockFetchUser = vi.fn()
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      }

      mockUseAuthentication.mockReturnValue({
        isAuthenticated: { value: true },
        user: { value: mockUser },
        fetchUser: mockFetchUser
      })

      const to = {
        path: '/',
        query: { oauth_success: 'true' }
      }

      const from = { path: '/login' } as any
      await authorizationMiddleware.default(to as any, from)

      // Should not fetch user if already authenticated
      expect(mockFetchUser).not.toHaveBeenCalled()
    })
  })

  describe('OAuth Success Without Query Parameter', () => {
    it('should not fetch user when oauth_success is not present', async () => {
      const mockFetchUser = vi.fn()

      mockUseAuthentication.mockReturnValue({
        isAuthenticated: { value: false },
        user: { value: null },
        fetchUser: mockFetchUser
      })

      const to = {
        path: '/',
        query: {}
      }

      const from = { path: '/login' } as any
      await authorizationMiddleware.default(to as any, from)

      // Should NOT fetch user without oauth_success flag
      expect(mockFetchUser).not.toHaveBeenCalled()
      // Should redirect to login
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })
  })

  describe('SSR vs Client-side Fetch', () => {
    it('should use SSR fetch (useFetch) for OAuth callback', async () => {
      const mockFetchUser = vi.fn().mockResolvedValue(undefined)

      mockUseAuthentication.mockReturnValue({
        isAuthenticated: { value: false },
        user: { value: null },
        fetchUser: mockFetchUser
      })

      const to = {
        path: '/',
        query: { oauth_success: 'true' }
      }

      const from = { path: '/login' } as any
      await authorizationMiddleware.default(to as any, from)

      // Should call with true to enable SSR (critical for httpOnly cookies)
      expect(mockFetchUser).toHaveBeenCalledWith(true)
      expect(mockFetchUser).toHaveBeenCalledTimes(1)
    })
  })

  describe('Protected Routes After OAuth', () => {
    it('should allow access to protected routes after OAuth authentication', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      }

      const mockFetchUser = vi.fn()
      mockHasPermission.mockReturnValue(true)

      mockUseAuthentication.mockReturnValue({
        isAuthenticated: { value: true },
        user: { value: mockUser },
        fetchUser: mockFetchUser
      })

      const to = {
        path: '/dashboard',
        query: {}
      }

      const from = { path: '/login' } as any
      const result = await authorizationMiddleware.default(to as any, from)

      expect(result).toBeUndefined() // Middleware allows passage
      expect(mockNavigateTo).not.toHaveBeenCalled()
      expect(mockHasPermission).toHaveBeenCalledWith('admin', '/dashboard', 'GET', testOptions.auth.permissions)
    })

    it('should block access to protected routes without permission after OAuth', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      }

      const mockFetchUser = vi.fn()
      mockHasPermission.mockReturnValue(false)

      mockUseAuthentication.mockReturnValue({
        isAuthenticated: { value: true },
        user: { value: mockUser },
        fetchUser: mockFetchUser
      })

      const to = {
        path: '/admin',
        query: {}
      }

      const from = { path: '/login' } as any
      await authorizationMiddleware.default(to as any, from)

      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })
  })

  describe('Whitelisted Paths', () => {
    it('should allow access to whitelisted paths even during OAuth flow', async () => {
      mockIsWhitelisted.mockReturnValue(true)

      const mockFetchUser = vi.fn()
      mockUseAuthentication.mockReturnValue({
        isAuthenticated: { value: false },
        user: { value: null },
        fetchUser: mockFetchUser
      })

      const to = {
        path: '/public-page',
        query: { oauth_success: 'true' }
      }

      const from = { path: '/login' } as any
      const result = await authorizationMiddleware.default(to as any, from)

      // Should not fetch user or redirect
      expect(mockFetchUser).not.toHaveBeenCalled()
      expect(mockNavigateTo).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })
})

