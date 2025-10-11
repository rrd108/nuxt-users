import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ModuleOptions, User } from '../../src/types'
import type { H3Event } from 'h3'
import { defaultOptions } from '../../src/module'

// Mock h3 functions
vi.mock('h3', () => ({
  defineEventHandler: vi.fn(handler => handler),
  sendRedirect: vi.fn(),
  getQuery: vi.fn(),
  setCookie: vi.fn()
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn()
}))

// Mock Google OAuth utilities
vi.mock('../../src/runtime/server/utils/google-oauth', () => ({
  createGoogleOAuth2Client: vi.fn(),
  getGoogleUserFromCode: vi.fn(),
  findOrCreateGoogleUser: vi.fn(),
  createAuthTokenForUser: vi.fn()
}))

// Import after mocks
const callbackHandler = await import('../../src/runtime/server/api/nuxt-users/auth/google/callback.get')

describe('Google OAuth Callback API', () => {
  let testOptions: ModuleOptions
  let mockEvent: Partial<H3Event>
  let mockGetQuery: ReturnType<typeof vi.fn>
  let mockSendRedirect: ReturnType<typeof vi.fn>
  let mockSetCookie: ReturnType<typeof vi.fn>
  let mockUseRuntimeConfig: ReturnType<typeof vi.fn>
  let mockCreateGoogleOAuth2Client: ReturnType<typeof vi.fn>
  let mockGetGoogleUserFromCode: ReturnType<typeof vi.fn>
  let mockFindOrCreateGoogleUser: ReturnType<typeof vi.fn>
  let mockCreateAuthTokenForUser: ReturnType<typeof vi.fn>

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    role: 'user',
    google_id: 'google-123',
    profile_picture: 'https://example.com/pic.jpg',
    active: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get mocked functions
    const h3 = await import('h3')
    const imports = await import('#imports')
    const googleOAuth = await import('../../src/runtime/server/utils/google-oauth')

    mockGetQuery = h3.getQuery as ReturnType<typeof vi.fn>
    mockSendRedirect = h3.sendRedirect as ReturnType<typeof vi.fn>
    mockSetCookie = h3.setCookie as ReturnType<typeof vi.fn>
    mockUseRuntimeConfig = imports.useRuntimeConfig as ReturnType<typeof vi.fn>
    mockCreateGoogleOAuth2Client = googleOAuth.createGoogleOAuth2Client as ReturnType<typeof vi.fn>
    mockGetGoogleUserFromCode = googleOAuth.getGoogleUserFromCode as ReturnType<typeof vi.fn>
    mockFindOrCreateGoogleUser = googleOAuth.findOrCreateGoogleUser as ReturnType<typeof vi.fn>
    mockCreateAuthTokenForUser = googleOAuth.createAuthTokenForUser as ReturnType<typeof vi.fn>

    // Setup test options
    testOptions = {
      ...defaultOptions,
      auth: {
        ...defaultOptions.auth,
        google: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          successRedirect: '/',
          errorRedirect: '/login?error=oauth_failed'
        }
      }
    }

    mockUseRuntimeConfig.mockReturnValue({
      nuxtUsers: testOptions
    })

    // Setup mock event
    mockEvent = {
      node: {
        req: {
          headers: {
            host: 'localhost:3000',
            'x-forwarded-proto': 'http'
          }
        },
        res: {}
      }
    } as unknown as H3Event

    // Default mock returns
    mockCreateGoogleOAuth2Client.mockReturnValue({})
    mockGetGoogleUserFromCode.mockResolvedValue({
      id: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/pic.jpg',
      verified_email: true
    })
    mockFindOrCreateGoogleUser.mockResolvedValue(mockUser)
    mockCreateAuthTokenForUser.mockResolvedValue('test-token-123')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful OAuth Flow', () => {
    it('should complete OAuth flow and redirect with oauth_success flag', async () => {
      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockCreateGoogleOAuth2Client).toHaveBeenCalled()
      expect(mockGetGoogleUserFromCode).toHaveBeenCalledWith({}, 'valid-auth-code')
      expect(mockFindOrCreateGoogleUser).toHaveBeenCalled()
      expect(mockCreateAuthTokenForUser).toHaveBeenCalledWith(mockUser, testOptions, true)
      expect(mockSetCookie).toHaveBeenCalledWith(
        mockEvent,
        'auth_token',
        'test-token-123',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/'
        })
      )
      expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/?oauth_success=true')
    })

    it('should append oauth_success to existing query params', async () => {
      const optionsWithQuery = {
        ...testOptions,
        auth: {
          ...testOptions.auth,
          google: {
            ...testOptions.auth.google!,
            successRedirect: '/dashboard?view=profile'
          }
        }
      }
      mockUseRuntimeConfig.mockReturnValue({ nuxtUsers: optionsWithQuery })
      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockSendRedirect).toHaveBeenCalledWith(
        mockEvent,
        '/dashboard?view=profile&oauth_success=true'
      )
    })

    it('should set cookie with correct maxAge for rememberMe', async () => {
      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockSetCookie).toHaveBeenCalledWith(
        mockEvent,
        'auth_token',
        expect.any(String),
        expect.objectContaining({
          maxAge: 60 * 60 * 24 * 30 // 30 days default
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should redirect to error page when Google OAuth is not configured', async () => {
      const optionsWithoutGoogle = {
        ...testOptions,
        auth: {
          ...testOptions.auth,
          google: undefined
        }
      }
      mockUseRuntimeConfig.mockReturnValue({ nuxtUsers: optionsWithoutGoogle })

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockSendRedirect).toHaveBeenCalledWith(
        mockEvent,
        '/login?error=oauth_not_configured'
      )
    })

    it('should handle OAuth error from Google', async () => {
      mockGetQuery.mockReturnValue({ error: 'access_denied' })

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockSendRedirect).toHaveBeenCalledWith(
        mockEvent,
        '/login?error=oauth_failed'
      )
    })

    it('should handle missing authorization code', async () => {
      mockGetQuery.mockReturnValue({})

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockSendRedirect).toHaveBeenCalledWith(
        mockEvent,
        expect.stringContaining('error=oauth_failed')
      )
    })

    it('should handle user not found when auto-registration is disabled', async () => {
      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })
      mockFindOrCreateGoogleUser.mockResolvedValue(null)

      await callbackHandler.default(mockEvent as H3Event)

      // Should redirect to error page (specific error is in callback implementation)
      expect(mockSendRedirect).toHaveBeenCalled()
      const redirectCall = mockSendRedirect.mock.calls[0]
      expect(redirectCall[1]).toContain('error=')
    })

    it('should handle inactive user account', async () => {
      const inactiveUser = { ...mockUser, active: false }
      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })
      mockFindOrCreateGoogleUser.mockResolvedValue(inactiveUser)

      await callbackHandler.default(mockEvent as H3Event)

      // Should redirect to error page
      expect(mockSendRedirect).toHaveBeenCalled()
      const redirectCall = mockSendRedirect.mock.calls[0]
      expect(redirectCall[1]).toContain('error=')
    })

    it('should handle exception during OAuth flow', async () => {
      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })
      mockGetGoogleUserFromCode.mockRejectedValue(new Error('Network error'))

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockSendRedirect).toHaveBeenCalledWith(
        mockEvent,
        '/login?error=oauth_failed'
      )
    })
  })

  describe('Security Checks', () => {
    it('should not create token for inactive user', async () => {
      const inactiveUser = { ...mockUser, active: false }
      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })
      mockFindOrCreateGoogleUser.mockResolvedValue(inactiveUser)

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockCreateAuthTokenForUser).not.toHaveBeenCalled()
      expect(mockSetCookie).not.toHaveBeenCalled()
    })

    it('should not create token for null user', async () => {
      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })
      mockFindOrCreateGoogleUser.mockResolvedValue(null)

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockCreateAuthTokenForUser).not.toHaveBeenCalled()
      expect(mockSetCookie).not.toHaveBeenCalled()
    })

    it('should use custom error redirect when configured', async () => {
      const optionsWithCustomError = {
        ...testOptions,
        auth: {
          ...testOptions.auth,
          google: {
            ...testOptions.auth.google!,
            errorRedirect: '/custom-error'
          }
        }
      }
      mockUseRuntimeConfig.mockReturnValue({ nuxtUsers: optionsWithCustomError })
      mockGetQuery.mockReturnValue({ error: 'access_denied' })

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockSendRedirect).toHaveBeenCalledWith(mockEvent, '/custom-error')
    })
  })

  describe('Cookie Configuration', () => {
    it('should set secure cookie in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockSetCookie).toHaveBeenCalledWith(
        mockEvent,
        'auth_token',
        expect.any(String),
        expect.objectContaining({
          secure: true
        })
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should not set secure cookie in development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockSetCookie).toHaveBeenCalledWith(
        mockEvent,
        'auth_token',
        expect.any(String),
        expect.objectContaining({
          secure: false
        })
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should set httpOnly cookie', async () => {
      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockSetCookie).toHaveBeenCalledWith(
        mockEvent,
        'auth_token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true
        })
      )
    })

    it('should set sameSite to lax', async () => {
      mockGetQuery.mockReturnValue({ code: 'valid-auth-code' })

      await callbackHandler.default(mockEvent as H3Event)

      expect(mockSetCookie).toHaveBeenCalledWith(
        mockEvent,
        'auth_token',
        expect.any(String),
        expect.objectContaining({
          sameSite: 'lax'
        })
      )
    })
  })
})

