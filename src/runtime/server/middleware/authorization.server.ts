import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import { readSessionToken, getSessionUser, handleUnauthenticatedRequest, handleInvalidToken, handleUnauthorizedRequest } from '../utils'
import { isApiPath, resolveAccess } from '../../utils/route-access'
import type { ModuleOptions } from 'nuxt-users/utils'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  const base = options.apiBasePath || '/api/nuxt-users'
  // event.path includes the query string, but routing ignores it: every check must use the pathname only,
  // otherwise e.g. `/api/nuxt-users?x=.` would look like a static file and skip authentication
  const path = event.path.split('?')[0]!
  const isApiRoute = isApiPath(path, base)
  const isMeEndpoint = path === `${base}/me`

  // Static files, Nuxt internals, public pages and endpoints, and the whitelist need no session
  const anonymous = resolveAccess(path, event.method, options)
  if (anonymous.allowed) {
    console.debug(`[Nuxt Users] authorization: public (${anonymous.reason}): ${path} (${event.method})`)
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
  // Endpoints open to every signed-in user, then role permissions
  // ============================================

  if (!resolveAccess(path, event.method, options, user).allowed) {
    return handleUnauthorizedRequest(event, user, isApiRoute)
  }

  // ============================================
  // Request authorized
  // ============================================

  console.debug(`[Nuxt Users] authorization: Authenticated request to ${path} for ${user.id} with role ${user.role}`)
  return
})
