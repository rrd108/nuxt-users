import { defineNuxtPlugin } from '#app'

/**
 * Theme detection plugin
 *
 * Automatically applies dark theme class based on system preferences.
 * Listens for changes to system theme and updates accordingly.
 */
export default defineNuxtPlugin(() => {
  // Only run on client side
  if (import.meta.server) {
    return
  }

  const applyTheme = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (prefersDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Apply theme immediately
  applyTheme()

  // Listen for changes to system theme preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    // Modern browsers support addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', applyTheme)
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(applyTheme)
    }
  }
})
