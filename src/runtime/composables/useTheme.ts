import { useState } from '#app'
import type { Ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface UseThemeReturn {
  /**
   * Current theme mode
   */
  theme: Ref<ThemeMode>

  /**
   * Current resolved theme (system resolved to actual light/dark)
   */
  resolvedTheme: Ref<'light' | 'dark'>

  /**
   * Set the theme mode
   */
  setTheme: (mode: ThemeMode) => void

  /**
   * Toggle between light and dark themes
   */
  toggleTheme: () => void
}

/**
 * Composable for managing theme state in nuxt-users module
 *
 * This composable provides a reactive theme state that can be shared
 * between the module and consumer applications.
 *
 * @example
 * ```vue
 * <script setup>
 * const { theme, setTheme, toggleTheme } = useTheme()
 * </script>
 *
 * <template>
 *   <button @click="toggleTheme">
 *     Current: {{ theme }}
 *   </button>
 * </template>
 * ```
 */
export const useTheme = (): UseThemeReturn => {
  const theme = useState<ThemeMode>('nuxt-users-theme', () => 'system')
  const resolvedTheme = useState<'light' | 'dark'>('nuxt-users-resolved-theme', () => 'light')

  const resolveTheme = (): 'light' | 'dark' => {
    if (theme.value === 'system') {
      if (typeof window === 'undefined') {
        return 'light'
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme.value as 'light' | 'dark'
  }

  const applyTheme = (resolved: 'light' | 'dark') => {
    if (typeof document === 'undefined') {
      return
    }

    if (resolved === 'dark') {
      document.documentElement.classList.add('dark')
    }
    if (resolved === 'light') {
      document.documentElement.classList.remove('dark')
    }

    resolvedTheme.value = resolved
  }

  const setTheme = (mode: ThemeMode) => {
    theme.value = mode
    const resolved = resolveTheme()
    applyTheme(resolved)

    // Dispatch custom event for external listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nuxt-users:theme-change', {
        detail: { mode, resolved }
      }))
    }
  }

  const toggleTheme = () => {
    const current = resolveTheme()
    const newMode: ThemeMode = current === 'dark' ? 'light' : 'dark'
    setTheme(newMode)
  }

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme
  }
}
