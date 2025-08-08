import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#app'
import { useAuthentication } from '../composables/useAuthentication'
import { hasPermission, isWhitelisted } from '../utils/permissions'
import { NO_AUTH_PATHS, NO_AUTH_API_PATHS } from '../constants'
import type { ModuleOptions } from '../../types'

export default defineNuxtRouteMiddleware((to) => {
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

  const { isAuthenticated, user } = useAuthentication()
  if (!isAuthenticated.value) {
    console.log(`[Nuxt Users] client.middleware.auth.global: Unauthenticated ${to.path}, redirecting to /login`)
    return navigateTo('/login')
  }

  // Check role-based permissions
  if (!user.value || !hasPermission(user.value.role, to.path, publicOptions.auth.permissions)) {
    console.log(`[Nuxt Users] client.middleware.auth.global: User with role ${user.value?.role} denied access to ${to.path}`)
    return navigateTo('/login')
  }

  console.log('[Nuxt Users] client.middleware.auth.global', {
    isAuthenticated: isAuthenticated.value,
    userRole: user.value?.role,
    to: to.path
  })
})
