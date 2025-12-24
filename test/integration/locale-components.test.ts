import { describe, it, expect } from 'vitest'
import { getTranslation } from '../../src/runtime/utils/locale'
import { en, hu, huFormal, defaultLocaleMessages } from '../../src/runtime/locales'
import type { LocaleMessages } from '../../src/types'

const getLocaleSection = (locale: LocaleMessages, section: string): LocaleMessages => {
  return (locale[section] as LocaleMessages) || {}
}

const getNestedLocaleSection = (locale: LocaleMessages, path: string): LocaleMessages => {
  const pathParts = path.split('.')
  let current: LocaleMessages = locale
  for (const part of pathParts) {
    current = (current[part] as LocaleMessages) || {}
  }
  return current
}

describe('Locale System Integration Tests', () => {
  describe('English translations', () => {
    it('should have complete login translations', () => {
      expect(getLocaleSection(en, 'login').title).toBe('Welcome Back')
      expect(getLocaleSection(en, 'login').subtitle).toBe('Sign in to your account')
      expect(getLocaleSection(en, 'common').email).toBe('Email')
      expect(getLocaleSection(en, 'common').password).toBe('Password')
      expect(getLocaleSection(en, 'login').rememberMe).toBe('Remember me')
      expect(getLocaleSection(en, 'login').submit).toBe('Sign In')
    })

    it('should have complete password strength translations', () => {
      expect(getLocaleSection(en, 'passwordStrength').label).toBe('Password Requirements:')
      expect(getNestedLocaleSection(en, 'passwordStrength.strength').weak).toBe('Weak')
      expect(getNestedLocaleSection(en, 'passwordStrength.strength').medium).toBe('Medium')
      expect(getNestedLocaleSection(en, 'passwordStrength.strength').strong).toBe('Strong')
      expect(getNestedLocaleSection(en, 'passwordStrength.strength').veryStrong).toBe('Very Strong')
      expect(getNestedLocaleSection(en, 'passwordStrength.requirements').minLength).toBe('At least {0} characters')
      expect(getNestedLocaleSection(en, 'passwordStrength.requirements').uppercase).toBe('Contains uppercase letter')
    })

    it('should have complete profile translations', () => {
      expect(getLocaleSection(en, 'profile').title).toBe('Profile Information')
      expect(getLocaleSection(en, 'profile').name).toBe('Name:')
      expect(getLocaleSection(en, 'profile').email).toBe('Email:')
    })

    it('should have complete user card translations', () => {
      expect(getLocaleSection(en, 'userCard').delete).toBe('Delete')
      expect(getLocaleSection(en, 'userCard').deleteConfirm).toBe('Are you sure you want to delete user {0}?')
    })
  })

  describe('Hungarian informal translations', () => {
    it('should have complete login translations', () => {
      expect(getLocaleSection(hu, 'login').title).toBe('Üdvözöljük')
      expect(getLocaleSection(hu, 'login').subtitle).toBe('Jelentkezz be a fiókodba')
      expect(getLocaleSection(hu, 'common').email).toBe('E-mail')
      expect(getLocaleSection(hu, 'common').password).toBe('Jelszó')
      expect(getLocaleSection(hu, 'login').rememberMe).toBe('Emlékezz rám')
      expect(getLocaleSection(hu, 'login').submit).toBe('Bejelentkezés')
    })

    it('should have informal register translations', () => {
      expect(getLocaleSection(hu, 'register').title).toBe('Regisztráció')
      expect(getLocaleSection(hu, 'register').subtitle).toBe('Hozz létre egy új fiókot')
      expect(getLocaleSection(hu, 'register').submit).toBe('Regisztrálj')
    })

    it('should have complete password strength translations', () => {
      expect(getLocaleSection(hu, 'passwordStrength').label).toBe('Jelszó követelmények:')
      expect(getNestedLocaleSection(hu, 'passwordStrength.strength').weak).toBe('Gyenge')
      expect(getNestedLocaleSection(hu, 'passwordStrength.strength').medium).toBe('Közepes')
      expect(getNestedLocaleSection(hu, 'passwordStrength.strength').strong).toBe('Erős')
      expect(getNestedLocaleSection(hu, 'passwordStrength.strength').veryStrong).toBe('Nagyon erős')
    })
  })

  describe('Hungarian formal translations', () => {
    it('should have formal login translations', () => {
      expect(getLocaleSection(huFormal, 'login').subtitle).toBe('Jelentkezzen be fiókjába')
      expect(getLocaleSection(huFormal, 'login').rememberMe).toBe('Bejelentkezve maradok')
    })

    it('should have formal register translations', () => {
      expect(getLocaleSection(huFormal, 'register').subtitle).toBe('Hozzon létre egy új fiókot')
      expect(getLocaleSection(huFormal, 'register').submit).toBe('Regisztráljon')
    })

    it('should share common translations with informal', () => {
      expect(getLocaleSection(huFormal, 'common').email).toBe('E-mail')
      expect(getLocaleSection(huFormal, 'common').password).toBe('Jelszó')
      expect(getLocaleSection(huFormal, 'login').title).toBe('Üdvözöljük')
    })
  })

  describe('Translation function with parameters', () => {
    it('should replace single parameter in English', () => {
      const result = getTranslation('userCard.deleteConfirm', 'en', undefined, 'en', ['John Doe'])
      expect(result).toBe('Are you sure you want to delete user John Doe?')
    })

    it('should replace single parameter in Hungarian', () => {
      const result = getTranslation('userCard.deleteConfirm', 'hu', undefined, 'en', ['Kovács János'])
      expect(result).toBe('Biztosan törlöd Kovács János felhasználót?')
    })

    it('should replace multiple parameters', () => {
      const result = getTranslation('passwordStrength.requirements.minLength', 'en', undefined, 'en', ['8'])
      expect(result).toBe('At least 8 characters')
    })
  })

  describe('Fallback chain', () => {
    it('should fall back to English for missing locale', () => {
      const result = getTranslation('login.title', 'de', undefined, 'en')
      expect(result).toBe('Welcome Back')
    })

    it('should fall back through custom texts to defaults', () => {
      const customTexts: Record<string, LocaleMessages> = {
        de: {
          profile: {
            title: 'Profil'
          }
        }
      }

      // Login translations not in custom German, should fall back to English
      const result = getTranslation('login.title', 'de', customTexts, 'en')
      expect(result).toBe('Welcome Back')

      // Profile title should use custom German
      const customResult = getTranslation('profile.title', 'de', customTexts, 'en')
      expect(customResult).toBe('Profil')
    })

    it('should return key if not found in any locale', () => {
      const result = getTranslation('nonexistent.key', 'en', undefined, 'en')
      expect(result).toBe('nonexistent.key')
    })
  })

  describe('Custom texts override', () => {
    it('should override English translations', () => {
      const customTexts: Record<string, LocaleMessages> = {
        en: {
          login: {
            title: 'Custom Welcome',
            submit: 'Custom Login'
          }
        }
      }

      const customTitle = getTranslation('login.title', 'en', customTexts)
      const customSubmit = getTranslation('login.submit', 'en', customTexts)
      const defaultSubtitle = getTranslation('login.subtitle', 'en', customTexts)

      expect(customTitle).toBe('Custom Welcome')
      expect(customSubmit).toBe('Custom Login')
      expect(defaultSubtitle).toBe('Sign in to your account')
    })

    it('should override Hungarian translations', () => {
      const customTexts: Record<string, LocaleMessages> = {
        hu: {
          login: {
            title: 'Egyedi üdvözlés'
          }
        }
      }

      const customTitle = getTranslation('login.title', 'hu', customTexts)
      const defaultSubmit = getTranslation('login.submit', 'hu', customTexts)

      expect(customTitle).toBe('Egyedi üdvözlés')
      expect(defaultSubmit).toBe('Bejelentkezés')
    })

    it('should allow adding new locales via custom texts', () => {
      const customTexts: Record<string, LocaleMessages> = {
        es: {
          login: {
            title: 'Bienvenido',
            submit: 'Iniciar sesión'
          }
        }
      }

      const title = getTranslation('login.title', 'es', customTexts, 'en')
      const submit = getTranslation('login.submit', 'es', customTexts, 'en')
      const subtitle = getTranslation('login.subtitle', 'es', customTexts, 'en')

      expect(title).toBe('Bienvenido')
      expect(submit).toBe('Iniciar sesión')
      // Falls back to English for missing translation
      expect(subtitle).toBe('Sign in to your account')
    })
  })

  describe('DefaultLocaleMessages export', () => {
    it('should include all locale files', () => {
      expect(defaultLocaleMessages.en).toBeDefined()
      expect(defaultLocaleMessages.hu).toBeDefined()
      expect(defaultLocaleMessages['hu-formal']).toBeDefined()
    })

    it('should match individual exports', () => {
      expect(defaultLocaleMessages.en).toEqual(en)
      expect(defaultLocaleMessages.hu).toEqual(hu)
      expect(defaultLocaleMessages['hu-formal']).toEqual(huFormal)
    })
  })

  describe('All translation keys coverage', () => {
    const assertKeysExistInAllLocales = (
      keys: string[],
      path: string,
      enLocale: LocaleMessages,
      huLocale: LocaleMessages,
      huFormalLocale: LocaleMessages
    ) => {
      keys.forEach((key) => {
        const enSection = getNestedLocaleSection(enLocale, path)
        const huSection = getNestedLocaleSection(huLocale, path)
        const huFormalSection = getNestedLocaleSection(huFormalLocale, path)

        expect(enSection[key]).toBeDefined()
        expect(huSection[key]).toBeDefined()
        expect(huFormalSection[key]).toBeDefined()
      })
    }

    it('should have all common keys in all locales', () => {
      assertKeysExistInAllLocales(
        ['email', 'password', 'name'],
        'common',
        en,
        hu,
        huFormal
      )
    })

    it('should have all login keys in all locales', () => {
      assertKeysExistInAllLocales(
        ['title', 'subtitle', 'forgotPassword', 'rememberMe', 'submit'],
        'login',
        en,
        hu,
        huFormal
      )
    })

    it('should have all register keys in all locales', () => {
      assertKeysExistInAllLocales(
        ['title', 'subtitle', 'passwordLabel', 'confirmPasswordLabel', 'submit', 'alreadyHaveAccount'],
        'register',
        en,
        hu,
        huFormal
      )
    })

    it('should have all password strength keys in all locales', () => {
      assertKeysExistInAllLocales(
        ['weak', 'medium', 'strong', 'veryStrong'],
        'passwordStrength.strength',
        en,
        hu,
        huFormal
      )

      assertKeysExistInAllLocales(
        ['minLength', 'uppercase', 'lowercase', 'numbers', 'specialChars'],
        'passwordStrength.requirements',
        en,
        hu,
        huFormal
      )
    })
  })
})
