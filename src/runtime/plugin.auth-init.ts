import { defineNuxtPlugin } from '#app'
import { useAuthentication } from './composables/useAuthentication'

/**
 * Early authentication initialization plugin
 *
 * This plugin runs early (name starts with '0') to ensure authentication state
 * is initialized from cookies before middleware runs. This prevents redirects
 * to login page when opening new tabs with valid session cookies.
 */
export default defineNuxtPlugin(async () => {
  // On server, initialize user state from cookies during SSR
  // This ensures the user state is available when the page hydrates
  if (import.meta.server) {
    const { fetchUser } = useAuthentication()

    try {
      // Use fetchUser with SSR mode to read cookies and initialize user state
      // This runs during SSR and ensures user state is available on client hydration
      await fetchUser(true) // useSSR = true
    }
    catch {
      // Silently fail - user is not authenticated or endpoint doesn't exist
      // This is expected behavior when user is not logged in
    }
    return
  }

  // Client-side: ensure user is initialized before middleware runs
  if (import.meta.client) {
    const { initializeUser } = useAuthentication()

    // Initialize user state immediately
    // This reads from localStorage/sessionStorage and validates with server
    // The promise is stored globally to prevent concurrent calls
    await initializeUser()
  }
})
