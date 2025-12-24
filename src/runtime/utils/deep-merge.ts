import type { LocaleMessages } from '../../types'

/**
 * Deep merge two objects
 * @param target - Base object
 * @param source - Object to merge into target
 * @returns Merged object
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
