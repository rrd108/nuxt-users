import { describe, it, expect } from 'vitest'
import {
  getAvailableRoles,
  isValidRole,
  assertValidRole,
  MAX_ROLE_LENGTH
} from '../../src/utils/role-validation'

describe('role-validation', () => {
  describe('getAvailableRoles', () => {
    it('returns empty array when permissions are missing', () => {
      expect(getAvailableRoles()).toEqual([])
      expect(getAvailableRoles(undefined)).toEqual([])
    })

    it('returns permission keys as available roles', () => {
      expect(getAvailableRoles({ admin: ['*'], user: ['/profile'] })).toEqual(['admin', 'user'])
    })
  })

  describe('isValidRole', () => {
    it('rejects empty and whitespace roles', () => {
      expect(isValidRole('')).toBe(false)
      expect(isValidRole('   ')).toBe(false)
      expect(isValidRole(null)).toBe(false)
      expect(isValidRole(undefined)).toBe(false)
    })

    it('rejects roles longer than MAX_ROLE_LENGTH', () => {
      expect(isValidRole('a'.repeat(MAX_ROLE_LENGTH + 1))).toBe(false)
    })

    it('allows any non-empty role when permissions are empty', () => {
      expect(isValidRole('admin', { permissions: {} })).toBe(true)
      expect(isValidRole('custom', { permissions: {}, allowCustomRoles: false })).toBe(true)
    })

    it('allows only predefined roles when permissions are set', () => {
      const options = { permissions: { admin: ['*'], user: ['/profile'] }, allowCustomRoles: false }
      expect(isValidRole('admin', options)).toBe(true)
      expect(isValidRole('user', options)).toBe(true)
      expect(isValidRole('moderator', options)).toBe(false)
    })

    it('allows custom roles when allowCustomRoles is true', () => {
      const options = { permissions: { admin: ['*'] }, allowCustomRoles: true }
      expect(isValidRole('moderator', options)).toBe(true)
      expect(isValidRole('admin', options)).toBe(true)
    })
  })

  describe('assertValidRole', () => {
    it('returns trimmed role when valid', () => {
      expect(assertValidRole('  admin  ', { permissions: { admin: ['*'] } })).toBe('admin')
    })

    it('throws for invalid predefined roles', () => {
      expect(() => assertValidRole('guest', {
        permissions: { admin: ['*'], user: ['/profile'] },
        allowCustomRoles: false
      })).toThrow('Invalid role "guest". Allowed roles: admin, user')
    })

    it('throws when role is missing', () => {
      expect(() => assertValidRole('')).toThrow('Role is required')
      expect(() => assertValidRole(null)).toThrow('Role is required')
    })
  })
})
