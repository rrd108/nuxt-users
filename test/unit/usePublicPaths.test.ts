import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ModuleOptions } from '../../src/types'

const mockUseRuntimeConfig = vi.fn()
const mockUseAuthentication = vi.fn()

vi.mock('#app', () => ({
  useRuntimeConfig: mockUseRuntimeConfig,
  useState: vi.fn(() => ({ value: null }))
}))

vi.mock('../../src/runtime/composables/useAuthentication', () => ({
  useAuthentication: mockUseAuthentication
}))

// Import after mocking
const { usePublicPaths } = await import('../../src/runtime/composables/usePublicPaths')

describe('usePublicPaths', () => {
  let mockConfig: ModuleOptions

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock runtime config
    mockConfig = {
      connector: {
        name: 'sqlite',
        options: {
          path: './test.db'
        }
      },
      apiBasePath: '/api/nuxt-users',
      tables: {
        migrations: 'migrations',
        users: 'users',
        personalAccessTokens: 'personal_access_tokens',
        passwordResetTokens: 'password_reset_tokens',
        passkeys: 'passkeys',
        passkeyChallenges: 'passkey_challenges'
      },
      passwordResetUrl: '/reset-password',
      emailConfirmationUrl: '/email-confirmation',
      auth: {
        whitelist: ['/about', '/contact'],
        tokenExpiration: 1440,
        rememberMeExpiration: 30,
        permissions: {
          admin: ['*'],
          user: ['/profile', '/dashboard'],
          moderator: ['/admin/*']
        },
        allowCustomRoles: false
      },
      passwordValidation: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
      },
      hardDelete: false,
      locale: {
        default: 'en',
        fallbackLocale: 'en',
        texts: {}
      }
    }

    mockUseRuntimeConfig.mockReturnValue({
      public: {
        nuxtUsers: mockConfig
      }
    })

    // Default mock for unauthenticated user
    mockUseAuthentication.mockReturnValue({
      user: { value: null }
    })
  })

  describe('getPublicPaths', () => {
    it('should return built-in public paths', () => {
      const { getPublicPaths } = usePublicPaths()
      const result = getPublicPaths()

      expect(result.builtIn.pages).toEqual(['/login', '/reset-password'])
      expect(result.builtIn.api).toEqual([
        'POST: /api/nuxt-users/password/forgot',
        'POST: /api/nuxt-users/password/reset',
        'POST, DELETE: /api/nuxt-users/session',
      ])
      expect(result.whitelist).toEqual(['/about', '/contact'])
      expect(result.apiBasePath).toBe('/api/nuxt-users')
    })

    it('should include whitelisted paths in all public paths', () => {
      const { getPublicPaths } = usePublicPaths()
      const result = getPublicPaths()

      expect(result.all).toContain('/about')
      expect(result.all).toContain('/contact')
    })
  })

  describe('isPublicPath', () => {
    it('should identify built-in public paths', () => {
      const { isPublicPath } = usePublicPaths()

      expect(isPublicPath('/login')).toBe(true)
      expect(isPublicPath('/reset-password')).toBe(true)
      expect(isPublicPath('GET, PATCH: /api/nuxt-users/me')).toBe(false)
    })

    it('should identify whitelisted paths as public', () => {
      const { isPublicPath } = usePublicPaths()

      expect(isPublicPath('/about')).toBe(true)
      expect(isPublicPath('/contact')).toBe(true)
    })

    it('should identify static assets as public', () => {
      const { isPublicPath } = usePublicPaths()

      expect(isPublicPath('/favicon.ico')).toBe(true)
      expect(isPublicPath('/_nuxt/app.js')).toBe(true)
    })

    it('should identify protected paths correctly', () => {
      const { isPublicPath } = usePublicPaths()

      expect(isPublicPath('/profile')).toBe(false)
      expect(isPublicPath('/admin')).toBe(false)
    })
  })
  describe('isPublicPath with methods and custom reset URL', () => {
    it('treats a dotted API path as protected, like the server does', () => {
      const { isPublicPath, isAccessiblePath } = usePublicPaths()

      expect(isPublicPath('/api/nuxt-users/me.json')).toBe(false)
      expect(isAccessiblePath('/api/export.csv')).toBe(false)
    })

    it('treats public API endpoints as public for their methods only', () => {
      const { isPublicPath } = usePublicPaths()

      expect(isPublicPath('/api/nuxt-users/session', 'POST')).toBe(true)
      expect(isPublicPath('/api/nuxt-users/session')).toBe(false)
    })

    it('treats a custom password reset URL as public', () => {
      mockConfig.passwordResetUrl = '/account/new-password'
      const { isPublicPath } = usePublicPaths()

      expect(isPublicPath('/account/new-password')).toBe(true)
    })
  })

  describe('isAccessiblePath', () => {
    it('lets a signed-in user reach auto-access endpoints and their role paths', () => {
      mockUseAuthentication.mockReturnValue({ user: { value: { id: 1, role: 'user' } } })
      const { isAccessiblePath } = usePublicPaths()

      expect(isAccessiblePath('/api/nuxt-users/me')).toBe(true)
      expect(isAccessiblePath('/api/nuxt-users/me', 'PATCH')).toBe(true)
      expect(isAccessiblePath('/profile')).toBe(true)
      expect(isAccessiblePath('/admin')).toBe(false)
    })

    it('only allows public paths for anonymous visitors', () => {
      const { isAccessiblePath } = usePublicPaths()

      expect(isAccessiblePath('/about')).toBe(true)
      expect(isAccessiblePath('/api/nuxt-users/me')).toBe(false)
      expect(isAccessiblePath('/profile')).toBe(false)
    })
  })
})
