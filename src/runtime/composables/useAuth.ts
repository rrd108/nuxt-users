import { ref, computed } from '#imports' // Use #imports for auto-import support in Nuxt
import { useCookie, navigateTo, useRuntimeConfig } from '#app' // $fetch is auto-imported by Nuxt
import type { UserPublic } from '../server/dto' // DTOs for client-side type safety
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, AuthUserResponse, MessageResponse } from '../server/dto'

// Define the shape of the auth state and actions
interface AuthState {
  user: Ref<UserPublic | null>
  token: Ref<string | null | undefined> // useCookie can be string | null | undefined
  isAuthenticated: ComputedRef<boolean>
  login: (credentials: LoginRequest) => Promise<void>
  register: (credentials: RegisterRequest) => Promise<void> // Consider what this should return or if it should auto-login
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
}

// Create a singleton state for auth
// The User type here should be UserPublic as the client should only see public data
const user = ref<UserPublic | null>(null)
const token = useCookie<string | null>('auth_token', {
  maxAge: 60 * 60 * 24 * 7, // 1 week
  sameSite: 'lax',
  // secure: true, // useCookie sets this based on protocol in production
  // httpOnly: false, // Must be false for client-side access for Authorization header
})

export const useAuth = (): AuthState => {
  const { nuxtUsers } = useRuntimeConfig().public

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await $fetch<LoginResponse>(`${nuxtUsers.apiBasePath}/login`, {
        method: 'POST',
        body: credentials,
      })
      if (response.token && response.user) {
        token.value = response.token
        user.value = response.user
      } else {
        throw new Error('Login response missing token or user data.')
      }
    } catch (error: any) {
      console.error('Login failed:', error.data?.message || error.message)
      token.value = null
      user.value = null
      throw error
    }
  }

  const register = async (credentials: RegisterRequest) => {
    try {
      // Assuming registration does not automatically log in the user.
      // The response type might just be a success message or the created user (public part).
      await $fetch<RegisterResponse>(`${nuxtUsers.apiBasePath}/register`, {
        method: 'POST',
        body: credentials,
      })
      // After successful registration, the user usually needs to log in separately.
    } catch (error: any) {
      console.error('Registration failed:', error.data?.message || error.message)
      throw error
    }
  }

  const fetchUser = async () => {
    if (!token.value) {
      user.value = null
      return
    }
    try {
      const response = await $fetch<AuthUserResponse>(`${nuxtUsers.apiBasePath}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      })
      user.value = response.user
    } catch (error: any) {
      console.warn('Failed to fetch user:', error.data?.message || error.message)
      token.value = null
      user.value = null
    }
  }

  const logout = async () => {
    // Always clear local state regardless of server response for logout
    const currentToken = token.value
    token.value = null
    user.value = null

    if (!currentToken) {
      return // No token to invalidate on server
    }

    try {
      await $fetch<MessageResponse>(`${nuxtUsers.apiBasePath}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      })
    } catch (error: any) {
      // Log server logout error but don't block client-side logout completion
      console.error('Server logout failed:', error.data?.message || error.message)
    }
    // Optional: redirect to login page
    // const loginPath = nuxtUsers.pages?.login || '/login'
    // await navigateTo(loginPath);
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
  }
}
