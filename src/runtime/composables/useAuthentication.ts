import { useState, useRuntimeConfig } from '#app'
import { computed, readonly } from 'vue'
import type { User, UserWithoutPassword } from 'nuxt-users/utils'

export const useAuthentication = () => {
  const user = useState<UserWithoutPassword | null>('user', () => null)
  const { public: { nuxtUsers } } = useRuntimeConfig()
  const apiBasePath = (nuxtUsers as { apiBasePath?: string })?.apiBasePath

  const isAuthenticated = computed(() => !!user.value)

  const login = (userData: User) => {
    // Remove password from user data before storing
    const { password: _, ...userWithoutPassword } = userData
    user.value = userWithoutPassword
    // Store in localStorage for persistence
    if (import.meta.client) {
      localStorage.setItem('user', JSON.stringify(userWithoutPassword))
    }
  }

  const logout = async () => {
    try {
      await $fetch(`${apiBasePath}/session`, { method: 'DELETE' })
      user.value = null
      if (import.meta.client) {
        localStorage.removeItem('user')
      }
    }
    catch (error) {
      console.error('Logout failed:', error)
      // Even if the API call fails, clear the user state
      user.value = null
    }
  }

  const fetchUser = async () => {
    try {
      const response = await $fetch<{ user: UserWithoutPassword }>(`${apiBasePath}/me`, { method: 'GET' })
      user.value = response.user
      // Update localStorage with fresh user data
      if (import.meta.client) {
        localStorage.setItem('user', JSON.stringify(response.user))
      }
      return response.user
    }
    catch (error) {
      console.error('Failed to fetch user:', error)
      // Clear invalid user data
      user.value = null
      if (import.meta.client) {
        localStorage.removeItem('user')
      }
      return null
    }
  }

  const initializeUser = async () => {
    // Only run on client-side
    if (!import.meta.client) {
      return
    }

    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        // First set the user from localStorage for immediate UI response
        user.value = JSON.parse(storedUser)
        // Then validate with server to ensure token is still valid
        await fetchUser()
      }
      catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('user')
        user.value = null
      }
    }
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
