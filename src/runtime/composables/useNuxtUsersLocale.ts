import { computed } from 'vue'
import { useRuntimeConfig } from '#app'
import type { ModuleOptions } from '../../types'
import { getTranslation } from '../utils/locale'

/**
 * Composable for accessing nuxt-users localized messages
 * 
 * @example
 * ```ts
 * const { t } = useNuxtUsersLocale()
 * const title = t('login.title') // 'Welcome Back'
 * const message = t('userCard.deleteConfirm', ['John']) // 'Are you sure you want to delete user John?'
 * ```
 */
export const useNuxtUsersLocale = () => {
  const { public: { nuxtUsers } } = useRuntimeConfig()
  const moduleOptions = nuxtUsers as ModuleOptions

  // Get current locale from module config
  const currentLocale = computed(() => {
    return moduleOptions.locale?.locale || 'en'
  })

  // Get fallback locale from module config
  const fallbackLocale = computed(() => {
    return moduleOptions.locale?.fallbackLocale || 'en'
  })

  /**
   * Get translation for a key
   * @param key - Translation key (e.g., 'login.title')
   * @param params - Optional parameters for string replacement
   */
  const t = (key: string, params?: (string | number)[]): string => {
    return getTranslation(
      key,
      currentLocale.value,
      moduleOptions.locale?.texts,
      fallbackLocale.value,
      params
    )
  }

  return {
    t,
    currentLocale,
    fallbackLocale
  }
}
