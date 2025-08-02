import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RouteLocationNormalizedGeneric } from 'vue-router'

const mockUseRuntimeConfig = vi.fn()
const mockDefineNuxtRouteMiddleware = vi.fn(middleware => middleware)
const mockNavigateTo = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('#app', () => ({
  useRuntimeConfig: mockUseRuntimeConfig,
  defineNuxtRouteMiddleware: mockDefineNuxtRouteMiddleware,
  navigateTo: mockNavigateTo
}))

vi.mock('../../src/runtime/composables/useAuth', () => ({
  useAuth: mockUseAuth
}))

// Import middleware after mocking
const clientAuthMiddleware = await import('../../src/runtime/middleware/auth.client')

describe('Auth Client Middleware', () => {
  let mockTo: RouteLocationNormalizedGeneric
  let mockFrom: RouteLocationNormalizedGeneric
  let mockOptions: { auth: { whitelist: string[] } }
  let mockUser: { value: { id?: number } | null }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock runtime config
    mockOptions = {
      auth: {
        whitelist: ['/register']
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
    mockUseAuth.mockReturnValue({
      user: mockUser
    })

    // Mock defineNuxtRouteMiddleware to return the middleware function
    mockDefineNuxtRouteMiddleware.mockImplementation(middleware => middleware)
  })

  it('should allow login requests without authentication', async () => {
    mockTo.path = '/login'

    const result = await clientAuthMiddleware.default(mockTo, mockFrom)

    expect(result).toBeUndefined()
    expect(mockUseAuth).not.toHaveBeenCalled()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('should allow the whitelisted /register route', async () => {
    mockTo.path = '/register'

    const result = await clientAuthMiddleware.default(mockTo, mockFrom)

    expect(result).toBeUndefined()
    expect(mockUseAuth).not.toHaveBeenCalled()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('should deny access to /profile with no user', async () => {
    mockTo.path = '/profile'

    // Mock user with no id
    mockUser.value = null

    const result = await clientAuthMiddleware.default(mockTo, mockFrom)

    expect(mockUseAuth).toHaveBeenCalled()
    expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    expect(result).toBeUndefined()
  })

  it('should deny access to /profile with user without id', async () => {
    mockTo.path = '/profile'

    // Mock user without id
    mockUser.value = { id: undefined }

    const result = await clientAuthMiddleware.default(mockTo, mockFrom)

    expect(mockUseAuth).toHaveBeenCalled()
    expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    expect(result).toBeUndefined()
  })

  it('should allow access to /profile with proper auth', async () => {
    mockTo.path = '/profile'

    // Mock user with valid id
    mockUser.value = { id: 1 }

    const result = await clientAuthMiddleware.default(mockTo, mockFrom)

    expect(mockUseAuth).toHaveBeenCalled()
    expect(mockNavigateTo).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
