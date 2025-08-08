import { defineEventHandler, getCookie, sendRedirect } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getCurrentUserFromToken } from '../utils'
import { hasPermission, isWhitelisted } from '../../utils/permissions'
import type { ModuleOptions } from '../../../types'
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

  // internal no-auth paths (e.g., /login)
  if (NO_AUTH_PATHS.includes(event.path)) {
    console.log('[Nuxt Users] server.middleware.auth.global: /login')
    return
  }

  // Always-allowed API endpoints for auth flows
  const openApiPaths = NO_AUTH_API_PATHS.map(path => `${base}${path}`)
  if (openApiPaths.includes(event.path)) {
    return
  }

  // whitelisted paths are allowed to access without authentication
  if (isWhitelisted(event.path, options.auth.whitelist)) {
    console.log(`[Nuxt Users] server.middleware.auth.global: whitelisted: ${event.path}`)
    return
  }

  // if the path is not whitelisted, check if the user is authenticated
  const token = getCookie(event, 'auth_token')
  if (!token) {
    console.log(`[Nuxt Users] server.middleware.auth.global: ${event.path} No token found redirecting to login`)
    return sendRedirect(event, '/login')
  }
  const user = await getCurrentUserFromToken(token, options)
  if (!user) {
    console.log(`[Nuxt Users] server.middleware.auth.global: ${event.path} No user found redirecting to login`)
    return sendRedirect(event, '/login')
  }

  // Check role-based permissions
  if (!hasPermission(user.role, event.path, options.auth.permissions)) {
    console.log(`[Nuxt Users] server.middleware.auth.global: ${event.path} User ${user.id} with role ${user.role} denied access`)
    return sendRedirect(event, '/login')
  }

  console.log(`[Nuxt Users] server.middleware.auth.global: Authenticated request to ${event.path} for ${user.id} with role ${user.role}`)
  return
})
