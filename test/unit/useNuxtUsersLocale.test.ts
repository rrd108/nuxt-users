import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNuxtUsersLocale } from '../../src/runtime/composables/useNuxtUsersLocale'
import type { ModuleOptions } from '../../src/types'
import { useRuntimeConfig } from '#app'

// Mock the Nuxt composables
vi.mock('#app', () => ({
  useRuntimeConfig: vi.fn()
}))

describe('useNuxtUsersLocale Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return translation function and locale info', () => {
    
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: {
        nuxtUsers: {
          locale: {
            locale: 'en',
            fallbackLocale: 'en',
            texts: {}
          }
        } as ModuleOptions
      }
    } as any)

    const { t, currentLocale, fallbackLocale } = useNuxtUsersLocale()

    expect(typeof t).toBe('function')
    expect(currentLocale.value).toBe('en')
    expect(fallbackLocale.value).toBe('en')
  })

  it('should translate keys using default English locale', () => {
    
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: {
        nuxtUsers: {
          locale: {
            locale: 'en',
            fallbackLocale: 'en',
            texts: {}
          }
        } as ModuleOptions
      }
    } as any)

    const { t } = useNuxtUsersLocale()

    expect(t('login.title')).toBe('Welcome Back')
    expect(t('login.submit')).toBe('Sign In')
    expect(t('common.email')).toBe('Email')
  })

  it('should translate keys using Hungarian locale', () => {
    
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: {
        nuxtUsers: {
          locale: {
            locale: 'hu',
            fallbackLocale: 'en',
            texts: {}
          }
        } as ModuleOptions
      }
    } as any)

    const { t } = useNuxtUsersLocale()

    expect(t('login.title')).toBe('Üdvözöljük')
    expect(t('login.submit')).toBe('Bejelentkezés')
    expect(t('common.email')).toBe('E-mail')
  })

  it('should translate keys using Hungarian formal locale', () => {
    
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: {
        nuxtUsers: {
          locale: {
            locale: 'hu-formal',
            fallbackLocale: 'en',
            texts: {}
          }
        } as ModuleOptions
      }
    } as any)

    const { t } = useNuxtUsersLocale()

    expect(t('login.rememberMe')).toBe('Maradjon bejelentkezve')
    // Common translations should be same
    expect(t('common.email')).toBe('E-mail')
  })

  it('should use custom texts from config', () => {
    
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: {
        nuxtUsers: {
          locale: {
            locale: 'en',
            fallbackLocale: 'en',
            texts: {
              en: {
                login: {
                  title: 'Custom Welcome Message'
                }
              }
            }
          }
        } as ModuleOptions
      }
    } as any)

    const { t } = useNuxtUsersLocale()

    expect(t('login.title')).toBe('Custom Welcome Message')
    // Other translations should still work from defaults
    expect(t('login.submit')).toBe('Sign In')
  })

  it('should fallback to English when translation missing', () => {
    
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: {
        nuxtUsers: {
          locale: {
            locale: 'de', // German not in default locales
            fallbackLocale: 'en',
            texts: {}
          }
        } as ModuleOptions
      }
    } as any)

    const { t } = useNuxtUsersLocale()

    // Should fallback to English
    expect(t('login.title')).toBe('Welcome Back')
  })

  it('should use specified fallback locale', () => {
    
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: {
        nuxtUsers: {
          locale: {
            locale: 'de',
            fallbackLocale: 'hu',
            texts: {}
          }
        } as ModuleOptions
      }
    } as any)

    const { t } = useNuxtUsersLocale()

    // Should fallback to Hungarian
    expect(t('login.title')).toBe('Üdvözöljük')
  })

  it('should handle parameter replacement', () => {
    
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: {
        nuxtUsers: {
          locale: {
            locale: 'en',
            fallbackLocale: 'en',
            texts: {}
          }
        } as ModuleOptions
      }
    } as any)

    const { t } = useNuxtUsersLocale()

    expect(t('userCard.deleteConfirm', ['John Doe'])).toBe('Are you sure you want to delete user John Doe?')
    expect(t('passwordStrength.minLength', [8])).toBe('At least 8 characters')
  })

  it('should return key when translation not found', () => {
    
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: {
        nuxtUsers: {
          locale: {
            locale: 'en',
            fallbackLocale: 'en',
            texts: {}
          }
        } as ModuleOptions
      }
    } as any)

    const { t } = useNuxtUsersLocale()

    expect(t('nonexistent.key')).toBe('nonexistent.key')
  })

  it('should default to en when locale config is missing', () => {
    
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: {
        nuxtUsers: {
          locale: {}
        } as ModuleOptions
      }
    } as any)

    const { t, currentLocale, fallbackLocale } = useNuxtUsersLocale()

    expect(currentLocale.value).toBe('en')
    expect(fallbackLocale.value).toBe('en')
    expect(t('login.title')).toBe('Welcome Back')
  })

})
