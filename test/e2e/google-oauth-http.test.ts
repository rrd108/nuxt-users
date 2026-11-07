import { describe, it, expect, vi, beforeEach } from 'vitest'
import callbackHandler from '../../src/runtime/server/api/nuxt-users/auth/google/callback.get'

// Mocks
const {
  mockSendRedirect,
  mockSetCookie,
  mockGetCookie,
  mockDeleteCookie,
  mockGetQuery,
  mockCreateGoogleOAuth2Client,
  mockGetGoogleUserFromCode,
  mockFindOrCreateGoogleUser,
  mockCreateAuthTokenForUser
} = vi.hoisted(() => ({
  mockSendRedirect: vi.fn(),
  mockSetCookie: vi.fn(),
  mockGetCookie: vi.fn(),
  mockDeleteCookie: vi.fn(),
  mockGetQuery: vi.fn(),
  mockGetRequestURL: vi.fn(),
  mockCreateGoogleOAuth2Client: vi.fn(),
  mockGetGoogleUserFromCode: vi.fn(),
  mockFindOrCreateGoogleUser: vi.fn(),
  mockCreateAuthTokenForUser: vi.fn()
}))

// Mock h3
vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>
  return {
    ...actual,
    sendRedirect: mockSendRedirect,
    setCookie: mockSetCookie,
    getCookie: mockGetCookie,
    deleteCookie: mockDeleteCookie,
    getQuery: mockGetQuery,
    defineEventHandler: (handler: unknown) => handler, // Unwrap for testing
  }
})

// Mock Nuxt imports
vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    nuxtUsers: {
      apiBasePath: '/api/test',
      auth: {
        rememberMeExpiration: 30,
        google: {
          clientId: 'mock-client-id',
          clientSecret: 'mock-client-secret',
          callbackUrl: '/api/test/auth/google/callback',
          successRedirect: '/dashboard',
          allowAutoRegistration: true
        }
      }
    }
  })
}))

// Mock Server Utils
vi.mock('../../src/runtime/server/utils', () => ({
  createGoogleOAuth2Client: mockCreateGoogleOAuth2Client,
  getGoogleUserFromCode: mockGetGoogleUserFromCode,
  findOrCreateGoogleUser: mockFindOrCreateGoogleUser,
  createAuthTokenForUser: mockCreateAuthTokenForUser
}))

type Handler = (event: Record<string, unknown>) => Promise<unknown>

describe('Google OAuth HTTP Callback Handler', () => {
  let mockEvent: Record<string, unknown>

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup basic mock event
    mockEvent = {
      node: {
        req: {
          headers: {
            'host': 'localhost:3000',
            'x-forwarded-proto': 'http'
          }
        }
      }
    }

    // Default mock behaviors
    mockGetCookie.mockReturnValue('valid-state')
    mockCreateGoogleOAuth2Client.mockReturnValue({})
    mockGetGoogleUserFromCode.mockResolvedValue({
      email: 'test@example.com',
      verified_email: true
    })
    mockFindOrCreateGoogleUser.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      active: true
    })
    mockCreateAuthTokenForUser.mockResolvedValue('mock-jwt-token')
  })

  it('should redirect to success URL with oauth_success flag on successful login', async () => {
    // Arrange
    mockGetQuery.mockReturnValue({ code: 'valid-code', state: 'valid-state' })

    // Act
    await (callbackHandler as unknown as Handler)(mockEvent)

    // Assert
    expect(mockCreateGoogleOAuth2Client).toHaveBeenCalled()
    expect(mockGetGoogleUserFromCode).toHaveBeenCalledWith(expect.anything(), 'valid-code')
    expect(mockFindOrCreateGoogleUser).toHaveBeenCalled()
    expect(mockCreateAuthTokenForUser).toHaveBeenCalled()

    // Cookie check
    expect(mockSetCookie).toHaveBeenCalledWith(
      mockEvent,
      'auth_token',
      'mock-jwt-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30
      })
    )

    // Redirect check
    expect(mockSendRedirect).toHaveBeenCalledWith(
      mockEvent,
      '/dashboard?oauth_success=true'
    )
  })

  it('should handle missing authorization code', async () => {
    // Arrange
    mockGetQuery.mockReturnValue({ state: 'valid-state' }) // No code

    // Act
    await (callbackHandler as unknown as Handler)(mockEvent)

    // Assert
    expect(mockGetGoogleUserFromCode).not.toHaveBeenCalled()
    expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/login?error=oauth_failed')
  })

  it('should handle OAuth error query param', async () => {
    // Arrange
    mockGetQuery.mockReturnValue({ error: 'access_denied', state: 'valid-state' })

    // Act
    await (callbackHandler as unknown as Handler)(mockEvent)

    // Assert
    expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/login?error=oauth_failed')
  })

  it('should handle user not found (auto-registration disabled)', async () => {
    // Arrange
    mockGetQuery.mockReturnValue({ code: 'valid-code', state: 'valid-state' })
    mockFindOrCreateGoogleUser.mockResolvedValue(null) // User not found

    // Act
    await (callbackHandler as unknown as Handler)(mockEvent)

    // Assert
    expect(mockSetCookie).not.toHaveBeenCalled()
    expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/login?error=user_not_registered')
  })

  it('should handle inactive user', async () => {
    // Arrange
    mockGetQuery.mockReturnValue({ code: 'valid-code', state: 'valid-state' })
    mockFindOrCreateGoogleUser.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      active: false // Inactive
    })

    // Act
    await (callbackHandler as unknown as Handler)(mockEvent)

    // Assert
    expect(mockSetCookie).not.toHaveBeenCalled()
    expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/login?error=account_inactive')
  })

  it('should handle internal errors during processing', async () => {
    // Arrange
    mockGetQuery.mockReturnValue({ code: 'valid-code', state: 'valid-state' })
    mockGetGoogleUserFromCode.mockRejectedValue(new Error('Google API Error'))

    // Act
    await (callbackHandler as unknown as Handler)(mockEvent)

    // Assert
    expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/login?error=oauth_failed')
  })

  it('should reject a callback whose state does not match the cookie (login CSRF)', async () => {
    mockGetQuery.mockReturnValue({ code: 'attacker-code', state: 'attacker-state' })

    await (callbackHandler as unknown as Handler)(mockEvent)

    expect(mockGetGoogleUserFromCode).not.toHaveBeenCalled()
    expect(mockSetCookie).not.toHaveBeenCalled()
    expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/login?error=oauth_failed')
  })

  it('should reject a callback without a state cookie', async () => {
    mockGetCookie.mockReturnValue(undefined)
    mockGetQuery.mockReturnValue({ code: 'attacker-code' })

    await (callbackHandler as unknown as Handler)(mockEvent)

    expect(mockGetGoogleUserFromCode).not.toHaveBeenCalled()
    expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/login?error=oauth_failed')
  })
})
