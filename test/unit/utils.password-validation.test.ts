import { describe, it, expect } from 'vitest'
import {
  validatePassword,
  getPasswordValidationOptions,
  getPasswordStrengthColor,
  getPasswordStrengthText
} from '../../src/utils/password-validation'

describe('Password Validation Utilities (src/utils/password-validation.ts)', () => {
  describe('getPasswordValidationOptions', () => {
    it('should return default options when no module options provided', () => {
      const options = getPasswordValidationOptions()

      expect(options).toEqual({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
      })
    })

    it('should return default options when module options is undefined', () => {
      const options = getPasswordValidationOptions(undefined)

      expect(options).toEqual({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
      })
    })

    it('should return default options when passwordValidation is undefined', () => {
      const options = getPasswordValidationOptions({})

      expect(options).toEqual({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
      })
    })

    it('should merge custom options with defaults', () => {
      const customOptions = {
        minLength: 12,
        requireUppercase: false,
        preventCommonPasswords: false
      }

      const options = getPasswordValidationOptions({ passwordValidation: customOptions })

      expect(options).toEqual({
        minLength: 12,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: false
      })
    })
  })

  describe('validatePassword', () => {
    describe('minimum length validation', () => {
      it('should fail when password is shorter than minimum length', () => {
        const result = validatePassword('short', { minLength: 8 })

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('passwordStrength.errors.minLength|8')
        expect(result.hints).toContain('passwordStrength.hints.minLength|8')
      })

      it('should pass when password meets minimum length', () => {
        const result = validatePassword('password123', {
          minLength: 8,
          requireUppercase: false,
          requireLowercase: false,
          requireNumbers: false,
          requireSpecialChars: false,
          preventCommonPasswords: false
        })

        expect(result.isValid).toBe(true)
        expect(result.errors).not.toContain('passwordStrength.errors.minLength|8')
      })

      it('should suggest longer password for better security', () => {
        const result = validatePassword('password123', { minLength: 8 })

        expect(result.hints).toContain('passwordStrength.hints.length12')
      })

      it('should not suggest longer password when already 12+ characters', () => {
        const result = validatePassword('verylongpassword123', { minLength: 8 })

        expect(result.hints).not.toContain('passwordStrength.hints.length12')
      })
    })

    describe('uppercase letter validation', () => {
      it('should fail when uppercase is required but not present', () => {
        const result = validatePassword('password123', { requireUppercase: true })

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('passwordStrength.errors.uppercase')
        expect(result.hints).toContain('passwordStrength.hints.uppercase')
      })

      it('should pass when uppercase is required and present', () => {
        const result = validatePassword('Password123', {
          requireUppercase: true,
          requireLowercase: false,
          requireNumbers: false,
          requireSpecialChars: false,
          preventCommonPasswords: false
        })

        expect(result.isValid).toBe(true)
        expect(result.errors).not.toContain('passwordStrength.errors.uppercase')
      })

      it('should pass when uppercase is not required', () => {
        const result = validatePassword('password123', {
          requireUppercase: false,
          requireLowercase: false,
          requireNumbers: false,
          requireSpecialChars: false,
          preventCommonPasswords: false
        })

        expect(result.isValid).toBe(true)
        expect(result.errors).not.toContain('passwordStrength.errors.uppercase')
      })
    })

    describe('lowercase letter validation', () => {
      it('should fail when lowercase is required but not present', () => {
        const result = validatePassword('PASSWORD123', { requireLowercase: true })

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('passwordStrength.errors.lowercase')
        expect(result.hints).toContain('passwordStrength.hints.lowercase')
      })

      it('should pass when lowercase is required and present', () => {
        const result = validatePassword('Password123', {
          requireLowercase: true,
          requireUppercase: false,
          requireNumbers: false,
          requireSpecialChars: false,
          preventCommonPasswords: false
        })

        expect(result.isValid).toBe(true)
        expect(result.errors).not.toContain('passwordStrength.errors.lowercase')
      })

      it('should pass when lowercase is not required', () => {
        const result = validatePassword('PASSWORD123', {
          requireLowercase: false,
          requireUppercase: false,
          requireNumbers: false,
          requireSpecialChars: false,
          preventCommonPasswords: false
        })

        expect(result.isValid).toBe(true)
        expect(result.errors).not.toContain('passwordStrength.errors.lowercase')
      })
    })

    describe('number validation', () => {
      it('should fail when numbers are required but not present', () => {
        const result = validatePassword('Password', { requireNumbers: true })

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('passwordStrength.errors.numbers')
        expect(result.hints).toContain('passwordStrength.hints.numbers')
      })

      it('should pass when numbers are required and present', () => {
        const result = validatePassword('Password123', {
          requireNumbers: true,
          requireUppercase: false,
          requireLowercase: false,
          requireSpecialChars: false,
          preventCommonPasswords: false
        })

        expect(result.isValid).toBe(true)
        expect(result.errors).not.toContain('passwordStrength.errors.numbers')
      })

      it('should pass when numbers are not required', () => {
        const result = validatePassword('Password', {
          requireNumbers: false,
          requireUppercase: false,
          requireLowercase: false,
          requireSpecialChars: false,
          preventCommonPasswords: false
        })

        expect(result.isValid).toBe(true)
        expect(result.errors).not.toContain('passwordStrength.errors.numbers')
      })
    })

    describe('special character validation', () => {
      it('should fail when special characters are required but not present', () => {
        const result = validatePassword('Password123', { requireSpecialChars: true })

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('passwordStrength.errors.specialChars')
        expect(result.hints).toContain('passwordStrength.hints.specialChars')
      })

      it('should pass when special characters are required and present', () => {
        const result = validatePassword('Password123!', {
          requireSpecialChars: true,
          requireUppercase: false,
          requireLowercase: false,
          requireNumbers: false,
          preventCommonPasswords: false
        })

        expect(result.isValid).toBe(true)
        expect(result.errors).not.toContain('passwordStrength.errors.specialChars')
      })

      it('should pass when special characters are not required', () => {
        const result = validatePassword('Password123', {
          requireSpecialChars: false,
          requireUppercase: false,
          requireLowercase: false,
          requireNumbers: false,
          preventCommonPasswords: false
        })

        expect(result.isValid).toBe(true)
        expect(result.errors).not.toContain('passwordStrength.errors.specialChars')
      })

      it('should recognize various special characters', () => {
        const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', ':', '"', '\\', '|', ',', '.', '<', '>', '/', '?']

        specialChars.forEach((char) => {
          const result = validatePassword(`Password123${char}`, {
            requireSpecialChars: true,
            requireUppercase: false,
            requireLowercase: false,
            requireNumbers: false,
            preventCommonPasswords: false
          })
          expect(result.isValid).toBe(true)
        })
      })
    })

    describe('common password prevention', () => {
      it('should fail when password is in common passwords list', () => {
        const result = validatePassword('password', { preventCommonPasswords: true })

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('passwordStrength.errors.common')
        expect(result.hints).toContain('passwordStrength.hints.common')
      })

      it('should pass when password is not in common passwords list', () => {
        const result = validatePassword('uniquePassword123!', { preventCommonPasswords: true })

        expect(result.isValid).toBe(true)
        expect(result.errors).not.toContain('passwordStrength.errors.common')
      })

      it('should pass when common password prevention is disabled', () => {
        const result = validatePassword('password', {
          preventCommonPasswords: false,
          requireUppercase: false,
          requireLowercase: false,
          requireNumbers: false,
          requireSpecialChars: false
        })

        expect(result.isValid).toBe(true)
        expect(result.errors).not.toContain('passwordStrength.errors.common')
      })

      it('should be case insensitive for common passwords', () => {
        const result = validatePassword('PASSWORD', { preventCommonPasswords: true })

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('passwordStrength.errors.common')
      })
    })

    describe('password scoring', () => {
      it('should give base score for meeting minimum length', () => {
        const result = validatePassword('password123', { minLength: 8 })

        expect(result.score).toBeGreaterThanOrEqual(20)
      })

      it('should add score for uppercase letters', () => {
        const result = validatePassword('Password123', { minLength: 8 })

        expect(result.score).toBeGreaterThanOrEqual(35) // 20 for length + 15 for uppercase
      })

      it('should add score for lowercase letters', () => {
        const result = validatePassword('PASSWORD123', { minLength: 8, requireLowercase: false })

        expect(result.score).toBeGreaterThanOrEqual(35) // 20 for length + 15 for lowercase
      })

      it('should add score for numbers', () => {
        const result = validatePassword('Password123', { minLength: 8 })

        expect(result.score).toBeGreaterThanOrEqual(50) // 20 for length + 15 for uppercase + 15 for numbers
      })

      it('should add score for special characters', () => {
        const result = validatePassword('Password123!', { minLength: 8 })

        expect(result.score).toBeGreaterThanOrEqual(65) // 20 for length + 15 for uppercase + 15 for numbers + 15 for special
      })

      it('should add length bonus for 12+ characters', () => {
        const result = validatePassword('verylongpassword123', { minLength: 8 })

        expect(result.score).toBeGreaterThanOrEqual(30) // 20 for length + 10 for length bonus
      })

      it('should add length bonus for 10+ characters', () => {
        const result = validatePassword('longpassword', { minLength: 8 })

        expect(result.score).toBeGreaterThanOrEqual(25) // 20 for length + 5 for length bonus
      })

      it('should add complexity bonus for multiple character types', () => {
        const result = validatePassword('Password123!', { minLength: 8 })

        expect(result.score).toBeGreaterThanOrEqual(75) // 20 for length + 15*4 for types + 10 for complexity
      })

      it('should cap score at 100', () => {
        const result = validatePassword('VeryLongPassword123!@#', { minLength: 8 })

        expect(result.score).toBeLessThanOrEqual(100)
      })
    })

    describe('strength classification', () => {
      it('should classify weak passwords correctly', () => {
        const result = validatePassword('weak', { minLength: 4 })

        expect(result.strength).toBe('weak')
        expect(result.score).toBeLessThan(60)
      })

      it('should classify medium passwords correctly', () => {
        const result = validatePassword('Password123', { minLength: 8 })

        expect(result.strength).toBe('medium')
        expect(result.score).toBeGreaterThanOrEqual(60)
        expect(result.score).toBeLessThan(80)
      })

      it('should classify strong passwords correctly', () => {
        const result = validatePassword('VeryStrongPassword123!@#', { minLength: 8 })

        expect(result.strength).toBe('strong')
        expect(result.score).toBeGreaterThanOrEqual(80)
      })
    })

    describe('hint deduplication', () => {
      it('should not have duplicate hints', () => {
        const result = validatePassword('short', { minLength: 8 })

        const uniqueHints = new Set(result.hints)
        expect(result.hints.length).toBe(uniqueHints.size)
      })
    })

    describe('edge cases', () => {
      it('should handle empty password', () => {
        const result = validatePassword('', { minLength: 8 })

        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('passwordStrength.errors.minLength|8')
        expect(result.score).toBe(0)
      })

      it('should handle very long passwords', () => {
        const longPassword = 'a'.repeat(1000)
        const result = validatePassword(longPassword, {
          minLength: 8,
          requireUppercase: false,
          requireLowercase: false,
          requireNumbers: false,
          requireSpecialChars: false,
          preventCommonPasswords: false
        })

        expect(result.isValid).toBe(true)
        expect(result.score).toBeLessThanOrEqual(100)
      })

      it('should handle passwords with only special characters', () => {
        const result = validatePassword('!@#$%^&*()', { minLength: 8, requireUppercase: false, requireLowercase: false, requireNumbers: false })

        expect(result.isValid).toBe(true)
      })

      it('should handle passwords with only numbers', () => {
        const result = validatePassword('123456789', {
          minLength: 8,
          requireUppercase: false,
          requireLowercase: false,
          requireSpecialChars: false,
          preventCommonPasswords: false
        })

        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('getPasswordStrengthColor', () => {
    it('should return red for weak passwords', () => {
      expect(getPasswordStrengthColor('weak')).toBe('#dc3545')
    })

    it('should return yellow for medium passwords', () => {
      expect(getPasswordStrengthColor('medium')).toBe('#ffc107')
    })

    it('should return green for strong passwords', () => {
      expect(getPasswordStrengthColor('strong')).toBe('#28a745')
    })

    it('should return gray for unknown strength', () => {
      expect(getPasswordStrengthColor('unknown' as 'weak' | 'medium' | 'strong')).toBe('#6c757d')
    })
  })

  describe('getPasswordStrengthText', () => {
    it('should return "Weak" for weak passwords', () => {
      expect(getPasswordStrengthText('weak')).toBe('Weak')
    })

    it('should return "Medium" for medium passwords', () => {
      expect(getPasswordStrengthText('medium')).toBe('Medium')
    })

    it('should return "Strong" for strong passwords', () => {
      expect(getPasswordStrengthText('strong')).toBe('Strong')
    })

    it('should return "Unknown" for unknown strength', () => {
      expect(getPasswordStrengthText('unknown' as 'weak' | 'medium' | 'strong')).toBe('Unknown')
    })
  })

  describe('integration scenarios', () => {
    it('should validate a strong password with all requirements', () => {
      const result = validatePassword('StrongPassword123!@#', {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
      })

      expect(result.isValid).toBe(true)
      expect(result.strength).toBe('strong')
      expect(result.score).toBeGreaterThanOrEqual(80)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate a weak password with all requirements', () => {
      const result = validatePassword('weak', {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
      })

      expect(result.isValid).toBe(false)
      expect(result.strength).toBe('weak')
      expect(result.score).toBeLessThan(60)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should provide helpful hints for improving password', () => {
      const result = validatePassword('password', {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true
      })

      expect(result.isValid).toBe(false)
      expect(result.hints.length).toBeGreaterThan(0)
      expect(result.hints).toContain('passwordStrength.hints.uppercase')
      expect(result.hints).toContain('passwordStrength.hints.numbers')
      expect(result.hints).toContain('passwordStrength.hints.specialChars')
      expect(result.hints).toContain('passwordStrength.hints.common')
    })
  })
})
