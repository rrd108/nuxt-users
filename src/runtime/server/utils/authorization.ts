import { createError, type H3Event } from 'h3'
import type { UserWithoutPassword } from 'nuxt-users/utils'

/**
 * Handles unauthenticated requests (no token found)
 * @param event - H3 event object
 * @param isApiRoute - Whether this is an API route
 * @param isMeEndpoint - Whether this is the /me endpoint (used for auth status checks)
 */
export const handleUnauthenticatedRequest = (event: H3Event, isApiRoute: boolean, isMeEndpoint: boolean) => {
  if (isApiRoute) {
    // /me endpoint is used to check auth status, so 401s are expected - use debug instead of warn
    if (isMeEndpoint) {
      console.debug(`[Nuxt Users] authorization: ${event.path} No token found - expected for auth check`)
    }
    else {
      console.warn(`[Nuxt Users] authorization: ${event.path} No token found - API request rejected`)
    }
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  // For pages, let client handle redirect
  console.debug(`[Nuxt Users] authorization: ${event.path} No token found - letting client handle page redirect`)
  return
}

/**
 * Handles invalid token requests
 * @param event - H3 event object
 * @param isApiRoute - Whether this is an API route
 * @param isMeEndpoint - Whether this is the /me endpoint (used for auth status checks)
 */
export const handleInvalidToken = (event: H3Event, isApiRoute: boolean, isMeEndpoint: boolean) => {
  if (isApiRoute) {
    // /me endpoint is used to check auth status, so 401s are expected - use debug instead of warn
    if (isMeEndpoint) {
      console.debug(`[Nuxt Users] authorization: ${event.path} Invalid token - expected for auth check`)
    }
    else {
      console.warn(`[Nuxt Users] authorization: ${event.path} Invalid token - API request rejected`)
    }
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  // For pages, let client handle redirect
  console.debug(`[Nuxt Users] authorization: ${event.path} Invalid token - letting client handle page redirect`)
  return
}

/**
 * Handles unauthorized requests (user lacks required permissions)
 * @param event - H3 event object
 * @param user - Authenticated user object
 * @param isApiRoute - Whether this is an API route
 */
export const handleUnauthorizedRequest = (event: H3Event, user: UserWithoutPassword, isApiRoute: boolean) => {
  if (isApiRoute) {
    console.warn(`[Nuxt Users] authorization: ${event.method}: ${event.path} User ${user.id} with role ${user.role} denied access - API request rejected`)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  // For pages, let client handle redirect
  console.debug(`[Nuxt Users] authorization: ${event.path} User ${user.id} with role ${user.role} denied access - letting client handle page redirect`)
  return
}
