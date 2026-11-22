import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#app'
import { useAuthentication } from '../composables/useAuthentication'
import { resolveAccess } from '../utils/route-access'
import type { RuntimeModuleOptions } from 'nuxt-users/utils'

export default defineNuxtRouteMiddleware(async (to) => {
  const { public: { nuxtUsers: publicNuxtUsers } } = useRuntimeConfig()
  const publicOptions = publicNuxtUsers as RuntimeModuleOptions

  // Pages are navigated with GET; public pages, the custom password reset page and the whitelist need no session
  const anonymous = resolveAccess(to.path, 'GET', publicOptions)
  if (anonymous.allowed) {
    console.log(`[Nuxt Users] client.middleware.auth.global: public (${anonymous.reason}): ${to.path}`)
    return
  }

  const { isAuthenticated, user, fetchUser, initializeUser } = useAuthentication()

  // Ensure user initialization is complete before checking authentication
  // This prevents redirects when opening new tabs with valid session cookies
  // The initialization promise is shared globally to prevent concurrent calls
  if (!isAuthenticated.value) {
    // Wait for initialization to complete (checks localStorage, sessionStorage, and server cookies)
    await initializeUser()
  }

  // If not authenticated but oauth_success flag is present, fetch user using SSR
  if (!isAuthenticated.value && to.query?.oauth_success === 'true') {
    try {
      await fetchUser(true) // Use SSR to properly handle httpOnly cookies
    }
    catch (error) {
      console.error('[Nuxt Users] Failed to fetch user after OAuth:', error)
    }
  }

  if (!isAuthenticated.value) {
    console.log(`[Nuxt Users] client.middleware.auth.global: Unauthenticated ${to.path}, redirecting to /login`)
    return navigateTo('/login')
  }

  // Check role-based permissions
  if (!user.value || !resolveAccess(to.path, 'GET', publicOptions, user.value).allowed) {
    console.log(`[Nuxt Users] client.middleware.auth.global: User with role ${user.value?.role} denied access to ${to.path}`)
    return navigateTo('/login')
  }
})
