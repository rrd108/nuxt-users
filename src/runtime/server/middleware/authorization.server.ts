import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import { readSessionToken, getSessionUser, handleUnauthenticatedRequest, handleInvalidToken, handleUnauthorizedRequest } from '../utils'
import { hasPermission, isWhitelisted } from '../../utils/permissions'
import type { ModuleOptions } from 'nuxt-users/utils'
import { PUBLIC_PAGES, PUBLIC_API_ENDPOINTS } from '../../constants'
import { isAuthenticatedAutoAccess } from '../../utils/auto-access'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  const base = options.apiBasePath || '/api/nuxt-users'
  // event.path includes the query string, but routing ignores it: every check must use the pathname only,
  // otherwise e.g. `/api/nuxt-users?x=.` would look like a static file and skip authentication
  const path = event.path.split('?')[0]!
  // the module's own endpoints count as API routes even when apiBasePath is outside /api/
  const isApiRoute = path.startsWith('/api/') || path === base || path.startsWith(`${base}/`)
  const isMeEndpoint = path === `${base}/me`

  // ============================================
  // Early exits: Skip non-applicable routes
  // ============================================

  // Static files (a dot in the pathname) and nuxt internals are skipped; API routes are never skipped
  const isStaticFile = !isApiRoute && path.includes('.')
  const isNuxtInternal = !isApiRoute && path.startsWith('/_')

  if (isStaticFile || isNuxtInternal) {
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

  if (publicAuthPaths.includes(path)) {
    console.debug(`[Nuxt Users] authorization: NO_AUTH_PATH: ${path}`)
    return
  }

  // Public API endpoints (no authentication required)
  for (const endpoint of PUBLIC_API_ENDPOINTS) {
    if (path === `${base}${endpoint.path}` && endpoint.methods.includes(event.method)) {
      console.debug(`[Nuxt Users] authorization: Public API endpoint ${path} (${event.method})`)
      return
    }
  }

  // Whitelisted paths are allowed to access without authentication
  if (isWhitelisted(path, options.auth.whitelist)) {
    console.debug(`[Nuxt Users] authorization: whitelisted: ${path}`)
    return
  }

  // ============================================
  // Authentication checks
  // ============================================

  if (!readSessionToken(event)) {
    return handleUnauthenticatedRequest(event, isApiRoute, isMeEndpoint)
  }

  // Also caches the user in event.context, so handlers do not look the token up again
  const user = await getSessionUser(event, options)
  if (!user) {
    return handleInvalidToken(event, isApiRoute, isMeEndpoint)
  }

  // ============================================
  // Auto-whitelisted endpoints for authenticated users
  // ============================================

  if (isAuthenticatedAutoAccess(path, event.method, base)) {
    console.debug(`[Nuxt Users] authorization: Auto-whitelisted endpoint ${path} for authenticated user ${user.id}`)
    return
  }

  // ============================================
  // Permission checks
  // ============================================

  if (!hasPermission(user.role, path, event.method, options.auth.permissions)) {
    return handleUnauthorizedRequest(event, user, isApiRoute)
  }

  // ============================================
  // Request authorized
  // ============================================

  console.debug(`[Nuxt Users] authorization: Authenticated request to ${path} for ${user.id} with role ${user.role}`)
  return
})
