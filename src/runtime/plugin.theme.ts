import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { useTheme } from './composables/useTheme'

/**
 * Theme detection plugin with hybrid detection support
 *
 * This plugin provides flexible theme management that works seamlessly
 * with consumer applications that have their own theme systems.
 *
 * Detection methods:
 * 1. System preference changes (prefers-color-scheme)
 * 2. DOM class changes via MutationObserver (consumer app control)
 * 3. Custom events (consumer app notification)
 * 4. Shared state via useTheme composable
 *
 * The plugin respects consumer app theme changes and won't conflict
 * with external theme management systems.
 */
export default defineNuxtPlugin(() => {
  // Only run on client side
  if (import.meta.server) {
    return
  }

  const config = useRuntimeConfig()
  const themeConfig = (config.public?.nuxtUsers as Record<string, unknown>)?.theme as { enabled?: boolean } | undefined

  // Allow consumer apps to disable the plugin
  if (themeConfig?.enabled === false) {
    return
  }

  const { setTheme, theme } = useTheme()

  // Track if we're the ones making changes (avoid circular updates)
  let isInternalChange = false

  const syncThemeFromDOM = () => {
    if (isInternalChange) {
      return
    }

    if (typeof document === 'undefined') {
      return
    }

    const isDark = document.documentElement.classList.contains('dark')
    const currentResolved = window.matchMedia('(prefers-color-scheme: dark)').matches

    // Determine if the class was set intentionally or matches system
    if (isDark) {
      theme.value = 'dark'
    }
    if (!isDark && !currentResolved) {
      theme.value = 'light'
    }
    if (!isDark && currentResolved) {
      // Class was removed despite system preference, user wants light
      theme.value = 'light'
    }
  }

  const handleSystemThemeChange = () => {
    // Only auto-apply if theme is set to 'system'
    if (theme.value === 'system') {
      isInternalChange = true
      setTheme('system')
      isInternalChange = false
    }
  }

  // 1. Listen to system preference changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    }
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange)
    }
  }

  // 2. Watch for DOM class changes (consumer app control)
  if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      syncThemeFromDOM()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  }

  // 3. Listen for custom events from consumer app
  if (typeof window !== 'undefined') {
    // Listen for standard theme-change event
    window.addEventListener('theme-change', (event: Event) => {
      const customEvent = event as CustomEvent
      const newTheme = customEvent.detail?.theme
      if (newTheme === 'light' || newTheme === 'dark') {
        isInternalChange = true
        setTheme(newTheme)
        isInternalChange = false
      }
    })

    // Also listen for color-scheme-change (some apps use this)
    window.addEventListener('color-scheme-change', (event: Event) => {
      const customEvent = event as CustomEvent
      const newTheme = customEvent.detail?.colorScheme || customEvent.detail?.theme
      if (newTheme === 'light' || newTheme === 'dark') {
        isInternalChange = true
        setTheme(newTheme)
        isInternalChange = false
      }
    })
  }

  // Apply initial theme (only if DOM doesn't already have dark class set by consumer)
  if (typeof document !== 'undefined') {
    const hasExistingDarkClass = document.documentElement.classList.contains('dark')

    if (hasExistingDarkClass) {
      // Consumer app already set the theme
      theme.value = 'dark'
    }
    if (!hasExistingDarkClass) {
      // Apply system preference by default
      setTheme('system')
    }
  }

  // Provide the theme composable to the app
  return {
    provide: {
      nuxtUsersTheme: useTheme()
    }
  }
})
