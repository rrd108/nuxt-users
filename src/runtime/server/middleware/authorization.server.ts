import { defineEventHandler, getCookie } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getCurrentUserFromToken, handleUnauthenticatedRequest, handleInvalidToken, handleUnauthorizedRequest } from '../utils'
import { hasPermission, isWhitelisted } from '../../utils/permissions'
import type { ModuleOptions } from 'nuxt-users/utils'
import { PUBLIC_PAGES, PUBLIC_API_ENDPOINTS, AUTHENTICATED_AUTO_ACCESS_ENDPOINTS } from '../../constants'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  const base = options.apiBasePath || '/api/nuxt-users'
  const isApiRoute = event.path.startsWith('/api/')
  const isMeEndpoint = event.path === `${base}/me`

  // ============================================
  // Early exits: Skip non-applicable routes
  // ============================================

  // Only apply authentication to pages and API routes
  const isPageOrApiRoute = !event.path.includes('.')
    && (event.path === '/'
      || isApiRoute
      || !event.path.startsWith('/_')) // nuxt internals

  if (!isPageOrApiRoute) {
    return
  }

  // ============================================
  // Public access checks (no authentication required)
  // ============================================

  // Internal public paths (e.g., /login, /reset-password) and custom password reset URL
  const publicAuthPaths = [...PUBLIC_PAGES]
  if (options.passwordResetUrl && options.passwordResetUrl !== '/reset-password') {
    publicAuthPaths.push(options.passwordResetUrl)
  }

  if (publicAuthPaths.includes(event.path)) {
    console.debug(`[Nuxt Users] authorization: NO_AUTH_PATH: ${event.path}`)
    return
  }

  // Public API endpoints (no authentication required)
  for (const endpoint of PUBLIC_API_ENDPOINTS) {
    if (event.path === `${base}${endpoint.path}` && endpoint.methods.includes(event.method)) {
      console.debug(`[Nuxt Users] authorization: Public API endpoint ${event.path} (${event.method})`)
      return
    }
  }

  // Whitelisted paths are allowed to access without authentication
  if (isWhitelisted(event.path, options.auth.whitelist)) {
    console.debug(`[Nuxt Users] authorization: whitelisted: ${event.path}`)
    return
  }

  // ============================================
  // Authentication checks
  // ============================================

  const token = getCookie(event, 'auth_token')

  // Handle missing token
  if (!token) {
    return handleUnauthenticatedRequest(event, isApiRoute, isMeEndpoint)
  }

  // Validate token and get user
  const user = await getCurrentUserFromToken(token, options)
  if (!user) {
    return handleInvalidToken(event, isApiRoute, isMeEndpoint)
  }

  // Store authenticated user in event context for reuse by handlers
  // This avoids double validation in endpoints like /me
  if (!event.context) {
    event.context = {}
  }
  event.context.nuxtUsers = event.context.nuxtUsers || {}
  event.context.nuxtUsers.user = user

  // ============================================
  // Auto-whitelisted endpoints for authenticated users
  // ============================================

  for (const endpoint of AUTHENTICATED_AUTO_ACCESS_ENDPOINTS) {
    if (event.path === `${base}${endpoint.path}` && endpoint.methods.includes(event.method)) {
      console.debug(`[Nuxt Users] authorization: Auto-whitelisted endpoint ${event.path} for authenticated user ${user.id}`)
      return
    }
  }

  // ============================================
  // Permission checks
  // ============================================

  if (!hasPermission(user.role, event.path, event.method, options.auth.permissions)) {
    return handleUnauthorizedRequest(event, user, isApiRoute)
  }

  // ============================================
  // Request authorized
  // ============================================

  console.debug(`[Nuxt Users] authorization: Authenticated request to ${event.path} for ${user.id} with role ${user.role}`)
  return
})
