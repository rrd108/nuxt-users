import { useState, useRuntimeConfig, useFetch } from '#app'
import { computed, readonly } from 'vue'
import type { User, UserWithoutPassword } from 'nuxt-users/utils'

// Global flag to track if initialization has been attempted
let initializationPromise: Promise<void> | null = null

export const useAuthentication = () => {
  const user = useState<UserWithoutPassword | null>('user', () => null)
  const { public: { nuxtUsers } } = useRuntimeConfig()
  const apiBasePath = (nuxtUsers as { apiBasePath?: string })?.apiBasePath

  const isAuthenticated = computed(() => !!user.value)

  const login = (userData: User, rememberMe: boolean = false) => {
    // Remove password from user data before storing
    const { password: _, ...userWithoutPassword } = userData
    user.value = userWithoutPassword

    // Store user data based on rememberMe preference
    if (import.meta.client) {
      // Clear any existing user data from both storages
      localStorage.removeItem('user')
      sessionStorage.removeItem('user')

      if (rememberMe) {
        // Store in localStorage for persistent login across browser sessions
        localStorage.setItem('user', JSON.stringify(userWithoutPassword))
        return
      }
      // Store in sessionStorage for session-only login
      sessionStorage.setItem('user', JSON.stringify(userWithoutPassword))
    }
  }

  const logout = async () => {
    try {
      await $fetch(`${apiBasePath}/session`, { method: 'DELETE' })
      user.value = null
      if (import.meta.client) {
        // Clear user data from both storages
        localStorage.removeItem('user')
        sessionStorage.removeItem('user')
      }
    }
    catch (error) {
      console.error('Logout failed:', error)
      // Even if the API call fails, clear the user state
      user.value = null
      if (import.meta.client) {
        localStorage.removeItem('user')
        sessionStorage.removeItem('user')
      }
    }
  }

  const fetchUser = async (useSSR = false) => {
    try {
      let userData: UserWithoutPassword | null = null

      if (useSSR) {
        // Use useFetch for SSR - properly handles cookies
        const { data, error } = await useFetch<{ user: UserWithoutPassword }>(`${apiBasePath}/me`, {
          server: true,
          lazy: false
        })

        if (error.value) {
          // Don't log expected 401 errors (user not authenticated)
          // These are normal when user is not logged in
          const statusCode = error.value.statusCode || error.value.status
          if (statusCode === 401) {
            // Expected: user is not authenticated
            user.value = null
            return null
          }
          throw new Error(error.value.message || 'Failed to fetch user')
        }

        userData = data.value?.user || null
      }
      if (!useSSR) {
        // Use $fetch for client-only requests
        const response = await $fetch<{ user: UserWithoutPassword }>(`${apiBasePath}/me`, {
          method: 'GET'
        })
        userData = response.user
      }

      if (!userData) {
        throw new Error('No user data received')
      }

      user.value = userData

      // Update the appropriate storage with fresh user data
      if (import.meta.client) {
        // Determine which storage was being used and update it
        const wasInLocalStorage = localStorage.getItem('user') !== null
        const wasInSessionStorage = sessionStorage.getItem('user') !== null

        if (wasInLocalStorage) {
          localStorage.setItem('user', JSON.stringify(userData))
        }
        if (wasInSessionStorage) {
          sessionStorage.setItem('user', JSON.stringify(userData))
        }
        if (!wasInLocalStorage && !wasInSessionStorage) {
          // Default to sessionStorage for new sessions without rememberMe
          sessionStorage.setItem('user', JSON.stringify(userData))
        }
      }
      return userData
    }
    catch (error: unknown) {
      // Don't log expected 401 errors (user not authenticated)
      // These are normal when user is not logged in
      const statusCode = (error as { statusCode?: number, status?: number, response?: { status?: number } })?.statusCode
        || (error as { statusCode?: number, status?: number, response?: { status?: number } })?.status
        || (error as { statusCode?: number, status?: number, response?: { status?: number } })?.response?.status
      if (statusCode === 401) {
        // Expected: user is not authenticated, silently handle it
        user.value = null
        if (import.meta.client) {
          localStorage.removeItem('user')
          sessionStorage.removeItem('user')
        }
        return null
      }

      // Log unexpected errors
      console.error('Failed to fetch user:', error)
      // Clear invalid user data from both storages
      user.value = null
      if (import.meta.client) {
        localStorage.removeItem('user')
        sessionStorage.removeItem('user')
      }
      return null
    }
  }

  const initializeUser = async () => {
    // Only run on client-side
    if (!import.meta.client) {
      return
    }

    // If initialization is already in progress, wait for it
    if (initializationPromise) {
      return initializationPromise
    }

    // Start initialization and store the promise to prevent concurrent calls
    initializationPromise = (async () => {
      // Check both localStorage and sessionStorage for stored user data
      const storedUserLocal = localStorage.getItem('user')
      const storedUserSession = sessionStorage.getItem('user')
      const storedUser = storedUserLocal || storedUserSession

      if (storedUser) {
        try {
          // First set the user from storage for immediate UI response
          user.value = JSON.parse(storedUser)
          // Then validate with server to ensure token is still valid
          await fetchUser()
        }
        catch (error) {
          console.error('Failed to parse stored user:', error)
          // Clear invalid data from both storages
          localStorage.removeItem('user')
          sessionStorage.removeItem('user')
          user.value = null
        }
        return
      }
      // No stored user data, but check server for valid session cookie
      // This handles cases where a new tab opens with a valid server-side session
      try {
        await fetchUser()
      }
      catch {
        // Silently fail - no valid session cookie exists
        // This is expected when user is not logged in
      }
    })().catch((_error) => {
      // Silently handle initialization errors
      // Don't prevent the composable from working
    })

    return initializationPromise
  }

  // Auto-initialize user on first access (client-side only)
  // This is a fallback - the plugin.auth-init.ts ensures initialization on app startup
  if (import.meta.client && !initializationPromise) {
    initializeUser()
  }

  return {
    user: readonly(user),
    isAuthenticated,
    login,
    logout,
    fetchUser,
    initializeUser
  }
}
