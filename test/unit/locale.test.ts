import { describe, it, expect, vi } from 'vitest'
import { getTranslation, deepMerge, getNestedValue } from '../../src/runtime/utils/locale'
import { defaultLocaleMessages } from '../../src/runtime/locales'
import type { LocaleMessages } from '../../src/types'

describe('Locale Utility Functions', () => {
  describe('getNestedValue', () => {
    it('should get a nested value using dot notation', () => {
      const obj: LocaleMessages = {
        login: {
          title: 'Welcome Back',
          subtitle: 'Sign in to your account'
        }
      }

      expect(getNestedValue(obj, 'login.title')).toBe('Welcome Back')
      expect(getNestedValue(obj, 'login.subtitle')).toBe('Sign in to your account')
    })

    it('should return undefined for non-existent keys', () => {
      const obj: LocaleMessages = {
        login: {
          title: 'Welcome Back'
        }
      }

      expect(getNestedValue(obj, 'login.nonexistent')).toBeUndefined()
      expect(getNestedValue(obj, 'nonexistent.key')).toBeUndefined()
    })

    it('should handle deep nesting', () => {
      const obj: LocaleMessages = {
        level1: {
          level2: {
            level3: 'deep value'
          }
        }
      }

      expect(getNestedValue(obj, 'level1.level2.level3')).toBe('deep value')
    })
  })

  describe('deepMerge', () => {
    it('should merge two objects deeply', () => {
      const base: LocaleMessages = {
        common: {
          email: 'Email',
          password: 'Password'
        },
        login: {
          title: 'Login'
        }
      }

      const override: LocaleMessages = {
        common: {
          password: 'Jelszó'
        },
        login: {
          subtitle: 'Sign in'
        }
      }

      const result = deepMerge(base, override)

      expect(result.common).toEqual({
        email: 'Email',
        password: 'Jelszó'
      })
      expect(result.login).toEqual({
        title: 'Login',
        subtitle: 'Sign in'
      })
    })

    it('should not mutate the original objects', () => {
      const base: LocaleMessages = {
        common: {
          email: 'Email'
        }
      }

      const override: LocaleMessages = {
        common: {
          password: 'Password'
        }
      }

      deepMerge(base, override)

      expect(base.common).toEqual({ email: 'Email' })
      expect(override.common).toEqual({ password: 'Password' })
    })
  })

  describe('getTranslation', () => {
    it('should get translation from default English locale', () => {
      const result = getTranslation('login.title')
      expect(result).toBe('Welcome Back')
    })

    it('should get translation from specified locale', () => {
      const result = getTranslation('login.title', 'hu')
      expect(result).toBe('Üdvözöljük')
    })

    it('should get translation from hu-formal locale', () => {
      const result = getTranslation('login.rememberMe', 'hu-formal')
      expect(result).toBe('Maradjon bejelentkezve')
    })

    it('should fallback to English when translation not found', () => {
      const result = getTranslation('nonexistent.key', 'hu')
      expect(result).toBe('nonexistent.key')
    })

    it('should use fallback locale when translation missing', () => {
      const customTexts: Record<string, LocaleMessages> = {
        de: {
          login: {
            // Only has title, subtitle missing
            title: 'Willkommen zurück'
          }
        }
      }

      // Should fall back to English for subtitle
      const result = getTranslation('login.subtitle', 'de', customTexts, 'en')
      expect(result).toBe('Sign in to your account')
    })

    it('should merge custom texts with defaults', () => {
      const customTexts: Record<string, LocaleMessages> = {
        en: {
          login: {
            title: 'Custom Welcome'
          }
        }
      }

      const result = getTranslation('login.title', 'en', customTexts)
      expect(result).toBe('Custom Welcome')

      // Other translations should still work
      const subtitle = getTranslation('login.subtitle', 'en', customTexts)
      expect(subtitle).toBe('Sign in to your account')
    })

    it('should replace parameters in translations', () => {
      const result = getTranslation('userCard.deleteConfirm', 'en', undefined, 'en', ['John Doe'])
      expect(result).toBe('Are you sure you want to delete user John Doe?')
    })

    it('should replace multiple parameters', () => {
      const result = getTranslation('passwordStrength.requirements.minLength', 'en', undefined, 'en', [8])
      expect(result).toBe('At least 8 characters')
    })

    it('should work with all default locales', () => {
      const locales = Object.keys(defaultLocaleMessages)
      
      locales.forEach(locale => {
        const result = getTranslation('login.title', locale)
        expect(result).toBeTruthy()
        expect(typeof result).toBe('string')
      })
    })

    it('should preserve common translations across formal/informal variants', () => {
      const informalEmail = getTranslation('common.email', 'hu')
      const formalEmail = getTranslation('common.email', 'hu-formal')
      
      expect(informalEmail).toBe(formalEmail)
      expect(informalEmail).toBe('E-mail')
    })

    it('should have different translations for formal/informal variants', () => {
      const informal = getTranslation('login.rememberMe', 'hu')
      const formal = getTranslation('login.rememberMe', 'hu-formal')
      
      expect(informal).toBe('Emlékezz rám')
      expect(formal).toBe('Maradjon bejelentkezve')
      expect(informal).not.toBe(formal)
    })

    it('should warn when parameter count does not match (in development)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      // Translation expects 1 parameter but we provide 2
      getTranslation('userCard.deleteConfirm', 'en', undefined, 'en', ['John', 'Extra'])
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Parameter count mismatch for key "userCard.deleteConfirm"')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('expected 1 parameter(s), but received 2')
      )

      process.env.NODE_ENV = originalEnv
      consoleSpy.mockRestore()
    })

    it('should not warn in production mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      // Translation expects 1 parameter but we provide 2 - should not warn in production
      getTranslation('userCard.deleteConfirm', 'en', undefined, 'en', ['John', 'Extra'])
      
      expect(consoleSpy).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
      consoleSpy.mockRestore()
    })
  })
})
