import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isBuildTime } from '../../src/runtime/server/utils/build-time'

describe('Build-time Detection', () => {
  const originalEnv = process.env
  const originalArgv = process.argv

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }
    process.argv = [...originalArgv]
  })

  afterEach(() => {
    // Restore environment
    process.env = originalEnv
    process.argv = originalArgv
  })

  describe('Environment Detection', () => {
    it('should detect NITRO_PRESET=nitro-prerender', () => {
      process.env.NITRO_PRESET = 'nitro-prerender'
      expect(isBuildTime()).toBe(true)
    })

    it('should detect NUXT_ENV=prerender', () => {
      process.env.NUXT_ENV = 'prerender'
      expect(isBuildTime()).toBe(true)
    })

    it('should detect build indicators in npm_lifecycle_event', () => {
      process.env.npm_lifecycle_event = 'build'
      expect(isBuildTime()).toBe(true)
    })

    it('should detect prerender in process arguments', () => {
      process.argv = ['node', 'nuxt', 'build', '--prerender']
      expect(isBuildTime()).toBe(true)
    })

    it('should return false when not in build time', () => {
      // Reset to normal runtime environment
      delete process.env.NITRO_PRESET
      delete process.env.NUXT_ENV
      delete process.env.npm_lifecycle_event
      process.argv = ['node', 'server.js']

      expect(isBuildTime()).toBe(false)
    })
  })

  describe('Database Connection Prevention', () => {
    it('should prevent database connections during build time', async () => {
      // Set build-time environment
      process.env.NITRO_PRESET = 'nitro-prerender'

      // Import the db module
      const { useDb } = await import('../../src/runtime/server/utils/db')

      const mockOptions = {
        connector: { name: 'sqlite' as const, options: { path: './test.db' } },
        tables: { migrations: 'migrations', users: 'users', personalAccessTokens: 'tokens', passwordResetTokens: 'reset_tokens' },
        apiBasePath: '/api/nuxt-users',
        passwordResetUrl: '/reset',
        emailConfirmationUrl: '/confirm',
        auth: { whitelist: [], tokenExpiration: 1440, rememberMeExpiration: 30, permissions: {} },
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
          locale: 'en',
          fallbackLocale: 'en',
          texts: {}
        }
      }

      // Should throw an error indicating build-time detection
      await expect(useDb(mockOptions))
        .rejects
        .toThrow('Database connections are not available during build/prerendering phase')
    })
  })

  describe('Production Build Scenarios', () => {
    it('should detect production builds with prerender flag', () => {
      process.env.NODE_ENV = 'production'
      process.argv = ['node', 'nuxt', 'build', '--prerender']

      expect(isBuildTime()).toBe(true)
    })

    it('should detect generate command', () => {
      process.argv = ['node', 'nuxt', 'generate']

      expect(isBuildTime()).toBe(true)
    })

    it('should not detect regular production server', () => {
      process.env.NODE_ENV = 'production'
      process.argv = ['node', 'server.js']
      delete process.env.npm_lifecycle_event

      expect(isBuildTime()).toBe(false)
    })
  })
})
