import { defineNuxtRouteMiddleware, useRuntimeConfig, navigateTo } from '#app'
import { useAuth } from '../composables/useAuth'

export default defineNuxtRouteMiddleware((to, _from) => {
  const { nuxtUsers } = useRuntimeConfig()
  const { user } = useAuth()

  // Always allow access to login page
  if (to.path === '/login') {
    return
  }

  if (
    !user.value
    && !nuxtUsers.auth?.whitelist?.includes(to.path)
  ) {
    return navigateTo('/login')
  }
})
