import { describe, it, expect } from 'vitest'
import { getTranslation } from '../../src/runtime/utils/locale'
import { en, hu, huFormal, defaultLocaleMessages } from '../../src/runtime/locales'
import type { LocaleMessages } from '../../src/types'

describe('Locale System Integration Tests', () => {
  describe('English translations', () => {
    it('should have complete login translations', () => {
      expect((en.login as LocaleMessages).title).toBe('Welcome Back')
      expect((en.login as LocaleMessages).subtitle).toBe('Sign in to your account')
      expect((en.common as LocaleMessages).email).toBe('Email')
      expect((en.common as LocaleMessages).password).toBe('Password')
      expect((en.login as LocaleMessages).rememberMe).toBe('Remember me')
      expect((en.login as LocaleMessages).submit).toBe('Sign In')
    })

    it('should have complete password strength translations', () => {
      expect((en.passwordStrength as LocaleMessages).label).toBe('Password Requirements:')
      expect(((en.passwordStrength as LocaleMessages).strength as LocaleMessages).weak).toBe('Weak')
      expect(((en.passwordStrength as LocaleMessages).strength as LocaleMessages).medium).toBe('Medium')
      expect(((en.passwordStrength as LocaleMessages).strength as LocaleMessages).strong).toBe('Strong')
      expect(((en.passwordStrength as LocaleMessages).strength as LocaleMessages).veryStrong).toBe('Very Strong')
      expect(((en.passwordStrength as LocaleMessages).requirements as LocaleMessages).minLength).toBe('At least {0} characters')
      expect(((en.passwordStrength as LocaleMessages).requirements as LocaleMessages).uppercase).toBe('Contains uppercase letter')
    })

    it('should have complete profile translations', () => {
      expect((en.profile as LocaleMessages).title).toBe('Profile Information')
      expect((en.profile as LocaleMessages).name).toBe('Name:')
      expect((en.profile as LocaleMessages).email).toBe('Email:')
    })

    it('should have complete user card translations', () => {
      expect((en.userCard as LocaleMessages).delete).toBe('Delete')
      expect((en.userCard as LocaleMessages).deleteConfirm).toBe('Are you sure you want to delete user {0}?')
    })
  })

  describe('Hungarian informal translations', () => {
    it('should have complete login translations', () => {
      expect((hu.login as LocaleMessages).title).toBe('Üdvözöljük')
      expect((hu.login as LocaleMessages).subtitle).toBe('Jelentkezz be a fiókodba')
      expect((hu.common as LocaleMessages).email).toBe('E-mail')
      expect((hu.common as LocaleMessages).password).toBe('Jelszó')
      expect((hu.login as LocaleMessages).rememberMe).toBe('Emlékezz rám')
      expect((hu.login as LocaleMessages).submit).toBe('Bejelentkezés')
    })

    it('should have informal register translations', () => {
      expect((hu.register as LocaleMessages).title).toBe('Regisztráció')
      expect((hu.register as LocaleMessages).subtitle).toBe('Hozz létre egy új fiókot')
      expect((hu.register as LocaleMessages).submit).toBe('Regisztrálj')
    })

    it('should have complete password strength translations', () => {
      expect((hu.passwordStrength as LocaleMessages).label).toBe('Jelszó követelmények:')
      expect(((hu.passwordStrength as LocaleMessages).strength as LocaleMessages).weak).toBe('Gyenge')
      expect(((hu.passwordStrength as LocaleMessages).strength as LocaleMessages).medium).toBe('Közepes')
      expect(((hu.passwordStrength as LocaleMessages).strength as LocaleMessages).strong).toBe('Erős')
      expect(((hu.passwordStrength as LocaleMessages).strength as LocaleMessages).veryStrong).toBe('Nagyon erős')
    })
  })

  describe('Hungarian formal translations', () => {
    it('should have formal login translations', () => {
      expect((huFormal.login as LocaleMessages).subtitle).toBe('Jelentkezzen be fiókjába')
      expect((huFormal.login as LocaleMessages).rememberMe).toBe('Maradjon bejelentkezve')
    })

    it('should have formal register translations', () => {
      expect((huFormal.register as LocaleMessages).subtitle).toBe('Hozzon létre egy új fiókot')
      expect((huFormal.register as LocaleMessages).submit).toBe('Regisztráljon')
    })

    it('should share common translations with informal', () => {
      expect((huFormal.common as LocaleMessages).email).toBe('E-mail')
      expect((huFormal.common as LocaleMessages).password).toBe('Jelszó')
      expect((huFormal.login as LocaleMessages).title).toBe('Üdvözöljük')
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
        const pathParts = path.split('.')
        let enObj: LocaleMessages = enLocale
        let huObj: LocaleMessages = huLocale
        let huFormalObj: LocaleMessages = huFormalLocale

        for (const part of pathParts) {
          enObj = enObj[part] as LocaleMessages
          huObj = huObj[part] as LocaleMessages
          huFormalObj = huFormalObj[part] as LocaleMessages
        }

        expect(enObj[key]).toBeDefined()
        expect(huObj[key]).toBeDefined()
        expect(huFormalObj[key]).toBeDefined()
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
