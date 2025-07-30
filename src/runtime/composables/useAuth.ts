import { useState } from '#app'
import type { User } from '../../types'

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)

  const logout = async () => {
    try {
      await $fetch('/api/logout', {
        method: 'GET'
      })
      user.value = null
    }
    catch (error) {
      console.error('Logout failed:', error)
      // Even if the API call fails, clear the user state
      user.value = null
    }
  }

  return {
    user,
    logout
  }
}
