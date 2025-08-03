import { describe, it, expect } from 'vitest'
import { pathMatchesPattern, hasPermission, isWhitelisted } from '../../src/runtime/utils/permissions'

describe('Permissions Utils', () => {
  describe('pathMatchesPattern', () => {
    it('should match exact paths', () => {
      expect(pathMatchesPattern('/profile', '/profile')).toBe(true)
      expect(pathMatchesPattern('/api/user/profile', '/api/user/profile')).toBe(true)
    })

    it('should not match different paths', () => {
      expect(pathMatchesPattern('/profile', '/dashboard')).toBe(false)
      expect(pathMatchesPattern('/api/user/profile', '/api/admin/users')).toBe(false)
    })

    it('should match wildcard pattern', () => {
      expect(pathMatchesPattern('/profile', '*')).toBe(true)
      expect(pathMatchesPattern('/api/user/profile', '*')).toBe(true)
      expect(pathMatchesPattern('/admin/dashboard', '*')).toBe(true)
    })

    it('should match patterns with wildcard at the end', () => {
      expect(pathMatchesPattern('/admin', '/admin/*')).toBe(true)
      expect(pathMatchesPattern('/admin/dashboard', '/admin/*')).toBe(true)
      expect(pathMatchesPattern('/admin/users/1', '/admin/*')).toBe(true)
      expect(pathMatchesPattern('/user/profile', '/admin/*')).toBe(false)
    })

    it('should match patterns with wildcard in the middle', () => {
      expect(pathMatchesPattern('/api/user/profile', '/api/*/profile')).toBe(true)
      expect(pathMatchesPattern('/api/admin/users', '/api/*/users')).toBe(true)
      expect(pathMatchesPattern('/api/user/settings', '/api/*/profile')).toBe(false)
    })

    it('should handle complex wildcard patterns', () => {
      expect(pathMatchesPattern('/api/admin/users/1', '/api/*/users/*')).toBe(true)
      expect(pathMatchesPattern('/api/user/profile/edit', '/api/*/profile/*')).toBe(true)
    })
  })

  describe('hasPermission', () => {
    const permissions = {
      admin: ['*'],
      user: ['/profile', '/api/user/profile'],
      moderator: ['/admin/*', '/api/admin/*', '/moderate/*']
    }

    it('should deny access when no permissions are configured', () => {
      expect(hasPermission('user', '/profile', {})).toBe(false)
      expect(hasPermission('admin', '/admin/dashboard', {})).toBe(false)
    })

    it('should deny access when user role is not found', () => {
      expect(hasPermission('guest', '/profile', permissions)).toBe(false)
      expect(hasPermission('unknown', '/admin/dashboard', permissions)).toBe(false)
    })

    it('should allow admin to access everything', () => {
      expect(hasPermission('admin', '/profile', permissions)).toBe(true)
      expect(hasPermission('admin', '/admin/dashboard', permissions)).toBe(true)
      expect(hasPermission('admin', '/api/admin/users', permissions)).toBe(true)
      expect(hasPermission('admin', '/any/path', permissions)).toBe(true)
    })

    it('should allow user to access their specific paths', () => {
      expect(hasPermission('user', '/profile', permissions)).toBe(true)
      expect(hasPermission('user', '/api/user/profile', permissions)).toBe(true)
    })

    it('should deny user access to other paths', () => {
      expect(hasPermission('user', '/admin/dashboard', permissions)).toBe(false)
      expect(hasPermission('user', '/api/admin/users', permissions)).toBe(false)
      expect(hasPermission('user', '/moderate/comments', permissions)).toBe(false)
    })

    it('should allow moderator to access admin and moderate paths', () => {
      expect(hasPermission('moderator', '/admin/dashboard', permissions)).toBe(true)
      expect(hasPermission('moderator', '/admin/users', permissions)).toBe(true)
      expect(hasPermission('moderator', '/api/admin/users', permissions)).toBe(true)
      expect(hasPermission('moderator', '/moderate/comments', permissions)).toBe(true)
    })

    it('should deny moderator access to user paths', () => {
      expect(hasPermission('moderator', '/profile', permissions)).toBe(false)
      expect(hasPermission('moderator', '/api/user/profile', permissions)).toBe(false)
    })
  })

  describe('isWhitelisted', () => {
    const whitelist = ['/login', '/register', '/api/auth/*']

    it('should allow exact matches', () => {
      expect(isWhitelisted('/login', whitelist)).toBe(true)
      expect(isWhitelisted('/register', whitelist)).toBe(true)
    })

    it('should allow wildcard matches', () => {
      expect(isWhitelisted('/api/auth/login', whitelist)).toBe(true)
      expect(isWhitelisted('/api/auth/forgot-password', whitelist)).toBe(true)
      expect(isWhitelisted('/api/auth/reset-password', whitelist)).toBe(true)
    })

    it('should deny non-whitelisted paths', () => {
      expect(isWhitelisted('/profile', whitelist)).toBe(false)
      expect(isWhitelisted('/admin/dashboard', whitelist)).toBe(false)
      expect(isWhitelisted('/api/user/profile', whitelist)).toBe(false)
    })

    it('should handle empty whitelist', () => {
      expect(isWhitelisted('/login', [])).toBe(false)
      expect(isWhitelisted('/any/path', [])).toBe(false)
    })
  })
})
