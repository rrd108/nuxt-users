import { useState } from '#app'
import { computed, readonly } from 'vue'
import type { User } from '../../types'

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)

  const isAuthenticated = computed(() => !!user.value)

  const login = (userData: User) => {
    user.value = userData
    // Store in localStorage for persistence
    if (import.meta.client) {
      localStorage.setItem('user', JSON.stringify(userData))
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/logout', {
        method: 'GET'
      })
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

  const initializeUser = () => {
    if (import.meta.client) {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser)
        }
        catch (error) {
          console.error('Failed to parse stored user:', error)
          localStorage.removeItem('user')
        }
      }
    }
  }

  return {
    user: readonly(user),
    isAuthenticated,
    login,
    logout,
    initializeUser
  }
}
