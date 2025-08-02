import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUseRuntimeConfig = vi.fn()
const mockDefineEventHandler = vi.fn(handler => handler)
const mockGetCookie = vi.fn()
const mockSendRedirect = vi.fn()

vi.mock('h3', () => ({
  defineEventHandler: mockDefineEventHandler,
  getCookie: mockGetCookie,
  sendRedirect: mockSendRedirect
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: mockUseRuntimeConfig
}))

// Import middleware after mocking
const serverAuthMiddleware = await import('../../src/runtime/server/middleware/auth.server')

vi.mock('../../src/runtime/server/utils', () => ({
  getCurrentUserFromToken: vi.fn()
}))

describe('Auth Server Middleware', () => {
  let mockEvent: any
  let mockOptions: { auth: { whitelist: string[] } }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock runtime config
    mockOptions = {
      auth: {
        whitelist: ['/register']
      }
    }
    mockUseRuntimeConfig.mockReturnValue({
      nuxtUsers: mockOptions
    })

    // Mock event object
    mockEvent = {
      path: '/favicon.ico'
    }

    // Mock defineEventHandler to return the handler function
    mockDefineEventHandler.mockImplementation(handler => handler)
  })

  it('should allow favicon.ico requests without authentication', async () => {
    mockEvent.path = '/favicon.ico'
    const result = await serverAuthMiddleware.default(mockEvent)

    expect(result).toBeUndefined()
    expect(mockGetCookie).not.toHaveBeenCalled()
    expect(mockSendRedirect).not.toHaveBeenCalled()
  })

  it('should allow login requests without authentication', async () => {
    mockEvent.path = '/login'
    const result = await serverAuthMiddleware.default(mockEvent)

    expect(result).toBeUndefined()
    expect(mockGetCookie).not.toHaveBeenCalled()
    expect(mockSendRedirect).not.toHaveBeenCalled()
  })

  it('should allow api login requests without authentication', async () => {
    mockEvent.path = '/api/login'
    const result = await serverAuthMiddleware.default(mockEvent)

    expect(result).toBeUndefined()
    expect(mockGetCookie).not.toHaveBeenCalled()
    expect(mockSendRedirect).not.toHaveBeenCalled()
  })

  it('should allow the whitelisted /register route', async () => {
    mockEvent.path = '/register'
    const result = await serverAuthMiddleware.default(mockEvent)

    expect(result).toBeUndefined()
    expect(mockGetCookie).not.toHaveBeenCalled()
    expect(mockSendRedirect).not.toHaveBeenCalled()
  })

  it('should deny access to /profile', async () => {
    mockEvent.path = '/profile'

    // Mock getCookie to return no token
    mockGetCookie.mockReturnValue(undefined)

    const result = await serverAuthMiddleware.default(mockEvent)

    expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')
    expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/login')
    expect(result).toBeUndefined()
  })

  it('should deny access to /profile with invalid token', async () => {
    mockEvent.path = '/profile'

    // Mock getCookie to return an invalid token
    mockGetCookie.mockReturnValue('invalid-token')

    // Mock getCurrentUserFromToken to return null (invalid user)
    const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
    vi.mocked(getCurrentUserFromToken).mockResolvedValue(null)

    const result = await serverAuthMiddleware.default(mockEvent)

    expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')
    expect(getCurrentUserFromToken).toHaveBeenCalledWith('invalid-token', mockOptions)
    expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/login')
    expect(result).toBeUndefined()
  })

  it('should deny access to /profile with invalid user', async () => {
    mockEvent.path = '/profile'

    // Mock getCookie to return a token
    mockGetCookie.mockReturnValue('valid-token')

    // Mock getCurrentUserFromToken to return null (invalid user)
    const { getCurrentUserFromToken } = await import('../../src/runtime/server/utils')
    vi.mocked(getCurrentUserFromToken).mockResolvedValue(null)

    const result = await serverAuthMiddleware.default(mockEvent)

    expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')
    expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
    expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/login')
    expect(result).toBeUndefined()
  })

  it('should allow access to /profile with proper auth', async () => {
    mockEvent.path = '/profile'

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
      updated_at: '2024-01-01T00:00:00Z'
    }
    vi.mocked(getCurrentUserFromToken).mockResolvedValue(mockUser)

    const result = await serverAuthMiddleware.default(mockEvent)

    expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')
    expect(getCurrentUserFromToken).toHaveBeenCalledWith('valid-token', mockOptions)
    expect(mockSendRedirect).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
