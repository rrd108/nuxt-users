import { describe, it, expect } from 'vitest'
import { pathMatchesPattern, hasPermission, isWhitelisted } from '../../src/runtime/utils/permissions'
import type { Permission } from '../../src/types'

describe('Permissions Utils', () => {
  describe('pathMatchesPattern', () => {
    it('should match exact paths', () => {
      expect(pathMatchesPattern('/profile', '/profile')).toBe(true)
      expect(pathMatchesPattern('/api/nuxt-users/me', '/api/nuxt-users/me')).toBe(true)
    })

    it('should not match different paths', () => {
      expect(pathMatchesPattern('/profile', '/dashboard')).toBe(false)
      expect(pathMatchesPattern('/api/nuxt-users/me', '/api/admin/users')).toBe(false)
    })

    it('should match wildcard pattern', () => {
      expect(pathMatchesPattern('/profile', '*')).toBe(true)
      expect(pathMatchesPattern('/api/nuxt-users/me', '*')).toBe(true)
      expect(pathMatchesPattern('/admin/dashboard', '*')).toBe(true)
    })

    it('should match patterns with wildcard at the end', () => {
      expect(pathMatchesPattern('/admin', '/admin/*')).toBe(true)
      expect(pathMatchesPattern('/admin/dashboard', '/admin/*')).toBe(true)
      expect(pathMatchesPattern('/admin/users/1', '/admin/*')).toBe(true)
      expect(pathMatchesPattern('/user/profile', '/admin/*')).toBe(false)
    })

    it('should match patterns with wildcard in the middle', () => {
      expect(pathMatchesPattern('/api/nuxt-users/me', '/api/*/profile')).toBe(false)
      expect(pathMatchesPattern('/api/admin/users', '/api/*/users')).toBe(true)
      expect(pathMatchesPattern('/api/user/settings', '/api/*/profile')).toBe(false)
    })

    it('should handle complex wildcard patterns', () => {
      expect(pathMatchesPattern('/api/admin/users/1', '/api/*/users/*')).toBe(true)
      expect(pathMatchesPattern('/api/nuxt-users/me/edit', '/api/*/profile/*')).toBe(false)
    })
  })

  describe('hasPermission', () => {
    const permissions: Record<string, (string | Permission)[]> = {
      admin: ['*'],
      user: ['/profile', '/api/nuxt-users/me'],
      manager: [
        { path: '/api/users/*', methods: ['GET', 'PATCH'] },
        '/manager-dashboard'
      ],
      viewer: [
        { path: '/api/posts', methods: ['GET'] }
      ]
    }

    it('should deny access when no permissions are configured', () => {
      expect(hasPermission('user', '/profile', 'GET', {})).toBe(false)
    })

    it('should deny access when user role is not found', () => {
      expect(hasPermission('guest', '/profile', 'GET', permissions)).toBe(false)
    })

    it('should always allow safe methods like OPTIONS and HEAD', () => {
      expect(hasPermission('guest', '/any/path', 'OPTIONS', permissions)).toBe(true)
      expect(hasPermission('user', '/api/users/1', 'HEAD', permissions)).toBe(true)
      expect(hasPermission('manager', '/api/users/1', 'OPTIONS', {})).toBe(true) // even with no permissions
    })

    describe('String-based permissions (backward compatibility)', () => {
      it('should allow admin to access everything', () => {
        expect(hasPermission('admin', '/profile', 'GET', permissions)).toBe(true)
        expect(hasPermission('admin', '/any/path', 'POST', permissions)).toBe(true)
      })

      it('should allow user to access their specific paths regardless of method', () => {
        expect(hasPermission('user', '/profile', 'GET', permissions)).toBe(true)
        expect(hasPermission('user', '/api/nuxt-users/me', 'POST', permissions)).toBe(true)
      })

      it('should deny user access to other paths', () => {
        expect(hasPermission('user', '/admin/dashboard', 'GET', permissions)).toBe(false)
      })
    })

    describe('Object-based permissions (method-specific)', () => {
      it('should allow manager to GET and PATCH user data', () => {
        expect(hasPermission('manager', '/api/users/123', 'GET', permissions)).toBe(true)
        expect(hasPermission('manager', '/api/users/456', 'PATCH', permissions)).toBe(true)
      })

      it('should deny manager from using other methods like DELETE or POST', () => {
        expect(hasPermission('manager', '/api/users/123', 'DELETE', permissions)).toBe(false)
        expect(hasPermission('manager', '/api/users/456', 'POST', permissions)).toBe(false)
      })

      it('should still allow access to simple string paths for the same role', () => {
        expect(hasPermission('manager', '/manager-dashboard', 'GET', permissions)).toBe(true)
      })

      it('should be case-insensitive with methods', () => {
        const lowerCasePermissions: Record<string, Permission[]> = {
          viewer: [{ path: '/api/test', methods: ['GET', 'POST'] }]
        }
        expect(hasPermission('viewer', '/api/test', 'get', lowerCasePermissions)).toBe(true)
        expect(hasPermission('viewer', '/api/test', 'post', lowerCasePermissions)).toBe(true)
        expect(hasPermission('viewer', '/api/test', 'patch', lowerCasePermissions)).toBe(false)
      })

      it('should deny access if path does not match', () => {
        expect(hasPermission('manager', '/api/other/123', 'GET', permissions)).toBe(false)
      })
    })
  })

  describe('isWhitelisted', () => {
    const whitelist = ['/login', '/register', '/public/*']

    it('should allow exact matches', () => {
      expect(isWhitelisted('/login', whitelist)).toBe(true)
    })

    it('should allow wildcard matches', () => {
      expect(isWhitelisted('/public/page', whitelist)).toBe(true)
      expect(isWhitelisted('/public/another/page', whitelist)).toBe(true)
    })

    it('should deny non-whitelisted paths', () => {
      expect(isWhitelisted('/profile', whitelist)).toBe(false)
    })

    it('should handle empty whitelist', () => {
      expect(isWhitelisted('/login', [])).toBe(false)
    })
  })
})
