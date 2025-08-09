import { defineEventHandler, getCookie, createError } from 'h3'
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
    console.log(`[Nuxt Users] server.middleware.auth.global: NO_AUTH_PATH: ${event.path}`)
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
    if (event.path.startsWith('/api/')) {
      console.log(`[Nuxt Users] server.middleware.auth.global: ${event.path} No token found - API request rejected`)
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    else {
      console.log(`[Nuxt Users] server.middleware.auth.global: ${event.path} No token found - letting client handle page redirect`)
      return
    }
  }

  const user = await getCurrentUserFromToken(token, options)
  if (!user) {
    if (event.path.startsWith('/api/')) {
      console.log(`[Nuxt Users] server.middleware.auth.global: ${event.path} Invalid token - API request rejected`)
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
    else {
      console.log(`[Nuxt Users] server.middleware.auth.global: ${event.path} Invalid token - letting client handle page redirect`)
      return
    }
  }

  // Check role-based permissions
  if (!hasPermission(user.role, event.path, event.method, options.auth.permissions)) {
    if (event.path.startsWith('/api/')) {
      console.log(`[Nuxt Users] server.middleware.auth.global: ${event.path} User ${user.id} with role ${user.role} denied access - API request rejected`)
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    else {
      console.log(`[Nuxt Users] server.middleware.auth.global: ${event.path} User ${user.id} with role ${user.role} denied access - letting client handle page redirect`)
      return
    }
  }

  console.log(`[Nuxt Users] server.middleware.auth.global: Authenticated request to ${event.path} for ${user.id} with role ${user.role}`)
  return
})
