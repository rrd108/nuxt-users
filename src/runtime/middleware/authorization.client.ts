import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#app'
import { useAuthentication } from '../composables/useAuthentication'
import { hasPermission, isWhitelisted } from '../utils/permissions'
import { NO_AUTH_PATHS, NO_AUTH_API_PATHS } from '../constants'
import type { ModuleOptions } from 'nuxt-users/utils'

export default defineNuxtRouteMiddleware(async (to) => {
  const { public: { nuxtUsers: publicNuxtUsers } } = useRuntimeConfig()
  const publicOptions = publicNuxtUsers as ModuleOptions
  const base = publicOptions.apiBasePath || '/api/nuxt-users'

  // internal no-auth paths (e.g., /login)
  if (NO_AUTH_PATHS.includes(to.path)) {
    console.log(`[Nuxt Users] client.middleware.auth.global: ${to.path}`)
    return
  }

  // Always-allowed API endpoints for auth flows
  const openApiPaths = NO_AUTH_API_PATHS.map(path => `${base}${path}`)
  if (openApiPaths.includes(to.path)) {
    return
  }

  // whitelisted paths are allowed to access without authentication
  if (isWhitelisted(to.path, publicOptions.auth.whitelist)) {
    console.log(`[Nuxt Users] client.middleware.auth.global: Whitelisted: ${to.path}`)
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
  if (!user.value || !hasPermission(user.value.role, to.path, 'GET', publicOptions.auth.permissions)) {
    console.log(`[Nuxt Users] client.middleware.auth.global: User with role ${user.value?.role} denied access to ${to.path}`)
    return navigateTo('/login')
  }
})
