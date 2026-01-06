import { defineEventHandler, getCookie, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getCurrentUserFromToken } from '../utils'
import { hasPermission, isWhitelisted } from '../../utils/permissions'
import type { ModuleOptions } from 'nuxt-users/utils'
import { NO_AUTH_PATHS, NO_AUTH_API_PATHS } from '../../constants'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  const base = options.apiBasePath || '/api/nuxt-users'

  // Only apply authentication to pages and API routes
  const isPageOrApiRoute = !event.path.includes('.')
    && (event.path === '/'
      || event.path.startsWith('/api/')
      || !event.path.startsWith('/_')) // nuxt internals

  if (!isPageOrApiRoute) {
    return
  }

  // internal no-auth paths (e.g., /login, /reset-password) and custom password reset URL
  const noAuthPaths = [...NO_AUTH_PATHS]
  // Add custom password reset URL if different from default
  if (options.passwordResetUrl && options.passwordResetUrl !== '/reset-password') {
    noAuthPaths.push(options.passwordResetUrl)
  }

  if (noAuthPaths.includes(event.path)) {
    console.debug(`[Nuxt Users] authorization: NO_AUTH_PATH: ${event.path}`)
    return
  }

  // Always-allowed API endpoints for auth flows
  const openApiPaths = NO_AUTH_API_PATHS.map(path => `${base}${path}`)
  if (openApiPaths.includes(event.path)) {
    return
  }

  // whitelisted paths are allowed to access without authentication
  if (isWhitelisted(event.path, options.auth.whitelist)) {
    console.debug(`[Nuxt Users] authorization: whitelisted: ${event.path}`)
    return
  }

  // if the path is not whitelisted, check if the user is authenticated
  const token = getCookie(event, 'auth_token')
  const isMeEndpoint = event.path === `${base}/me`

  if (!token) {
    if (event.path.startsWith('/api/')) {
      // /me endpoint is used to check auth status, so 401s are expected - use debug instead of warn
      if (isMeEndpoint) {
        console.debug(`[Nuxt Users] authorization: ${event.path} No token found - expected for auth check`)
      }
      else {
        console.warn(`[Nuxt Users] authorization: ${event.path} No token found - API request rejected`)
      }
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    if (!event.path.startsWith('/api/')) {
      console.debug(`[Nuxt Users] authorization: ${event.path} No token found - letting client handle page redirect`)
      return
    }
  }

  const user = await getCurrentUserFromToken(token!, options)
  if (!user) {
    if (event.path.startsWith('/api/')) {
      // /me endpoint is used to check auth status, so 401s are expected - use debug instead of warn
      if (isMeEndpoint) {
        console.debug(`[Nuxt Users] authorization: ${event.path} Invalid token - expected for auth check`)
      }
      else {
        console.warn(`[Nuxt Users] authorization: ${event.path} Invalid token - API request rejected`)
      }
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    if (!event.path.startsWith('/api/')) {
      console.debug(`[Nuxt Users] authorization: ${event.path} Invalid token - letting client handle page redirect`)
      return
    }
  }

  // Store authenticated user in event context for reuse by handlers
  // This avoids double validation in endpoints like /me
  event.context.nuxtUsers = event.context.nuxtUsers || {}
  event.context.nuxtUsers.user = user

  // Auto-whitelist /me endpoint for any authenticated user
  if (event.path === `${base}/me`) {
    console.debug(`[Nuxt Users] authorization: Auto-whitelisted /me endpoint for authenticated user ${user!.id}`)
    return
  }

  // Check role-based permissions
  if (!hasPermission(user!.role, event.path, event.method, options.auth.permissions)) {
    if (event.path.startsWith('/api/')) {
      console.warn(`[Nuxt Users] authorization: ${event.path} User ${user!.id} with role ${user!.role} denied access - API request rejected`)
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    if (!event.path.startsWith('/api/')) {
      console.debug(`[Nuxt Users] authorization: ${event.path} User ${user!.id} with role ${user!.role} denied access - letting client handle page redirect`)
      return
    }
  }

  console.debug(`[Nuxt Users] authorization: Authenticated request to ${event.path} for ${user!.id} with role ${user!.role}`)
  return
})
