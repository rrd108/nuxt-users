import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ModuleOptions } from '../../src/types'

const mockUseRuntimeConfig = vi.fn()
const mockUseAuthentication = vi.fn()

vi.mock('#app', () => ({
  useRuntimeConfig: mockUseRuntimeConfig,
  useState: vi.fn(() => ({ value: null }))
}))

vi.mock('../src/runtime/composables/useAuthentication', () => ({
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
        passwordResetTokens: 'password_reset_tokens'
      },
      passwordResetUrl: '/reset-password',
      emailConfirmationUrl: '/email-confirmation',
      auth: {
        whitelist: ['/about', '/contact'],
        tokenExpiration: 1440,
        permissions: {
          admin: ['*'],
          user: ['/profile', '/dashboard'],
          moderator: ['/admin/*']
        }
      },
      passwordValidation: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
      },
      hardDelete: false
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
        '/api/nuxt-users/session',
        '/api/nuxt-users/password/forgot',
        '/api/nuxt-users/password/reset'
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
      expect(isPublicPath('/api/nuxt-users/session')).toBe(true)
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
})
