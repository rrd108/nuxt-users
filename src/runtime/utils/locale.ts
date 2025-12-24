import type { LocaleMessages } from '../../types'
import { defaultLocaleMessages } from '../locales'

/**
 * Deep merge two objects
 */
export const deepMerge = (target: LocaleMessages, source: LocaleMessages): LocaleMessages => {
  const result: LocaleMessages = { ...target }

  for (const key in source) {
    const sourceValue = source[key]
    if (!sourceValue) {
      result[key] = sourceValue as string
    }
    else if (typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      result[key] = deepMerge(
        (result[key] as LocaleMessages) || {},
        sourceValue as LocaleMessages
      )
    }
    else {
      result[key] = sourceValue as string
    }
  }

  return result
}

/**
 * Get a nested value from an object using dot notation
 */
export const getNestedValue = (obj: LocaleMessages, path: string): string | undefined => {
  const keys = path.split('.')
  let value: string | LocaleMessages | undefined = obj

  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key]
    }
    else {
      return undefined
    }
  }

  return typeof value === 'string' ? value : undefined
}

/**
 * Get translation for a key
 * @param key - Translation key (e.g., 'login.title')
 * @param locale - Current locale
 * @param customTexts - Custom texts from config
 * @param fallbackLocale - Fallback locale
 * @param params - Parameters to replace in the translation (e.g., {0}, {1})
 */
export const getTranslation = (
  key: string,
  locale: string = 'en',
  customTexts?: Record<string, LocaleMessages>,
  fallbackLocale: string = 'en',
  params?: (string | number)[]
): string => {
  // Merge custom texts with defaults for the current locale
  const localeMessages = customTexts?.[locale]
    ? deepMerge(defaultLocaleMessages[locale] || {}, customTexts[locale])
    : defaultLocaleMessages[locale]

  // Try to get the translation from the current locale
  let translation = localeMessages ? getNestedValue(localeMessages, key) : undefined

  // If not found and fallback is different, try fallback locale
  if (!translation && fallbackLocale !== locale) {
    const fallbackMessages = customTexts?.[fallbackLocale]
      ? deepMerge(defaultLocaleMessages[fallbackLocale] || {}, customTexts[fallbackLocale])
      : defaultLocaleMessages[fallbackLocale]

    translation = fallbackMessages ? getNestedValue(fallbackMessages, key) : undefined
  }

  // If still not found, try default English
  if (!translation && locale !== 'en' && fallbackLocale !== 'en' && defaultLocaleMessages.en) {
    translation = getNestedValue(defaultLocaleMessages.en, key)
  }

  // Replace parameters if provided
  if (translation && params && params.length > 0) {
    // Count expected placeholders in the translation
    const placeholderMatches = translation.match(/\{\d+\}/g)
    const expectedParamCount = placeholderMatches ? placeholderMatches.length : 0

    // Warn if parameter count doesn't match (in development)
    if (expectedParamCount !== params.length && process.env.NODE_ENV !== 'production') {
      console.warn(
        `[nuxt-users locale] Parameter count mismatch for key "${key}": `
        + `expected ${expectedParamCount} parameter(s), but received ${params.length}`
      )
    }

    // Replace all parameters
    params.forEach((param, index) => {
      translation = translation!.replace(`{${index}}`, String(param))
    })
  }

  // Return the translation or the key as fallback
  return translation || key
}
