import { defineEventHandler, getCookie, sendRedirect, useRuntimeConfig } from '#imports'
import { getCurrentUserFromToken } from '../utils'
import type { ModuleOptions } from '../../../types'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  // Only apply authentication to pages and API routes
  const isPageOrApiRoute = !event.path.includes('.')
    && (event.path === '/'
      || event.path.startsWith('/api/')
      || !event.path.startsWith('/_')) // nuxt internals

  if (!isPageOrApiRoute) {
    return
  }

  // login page is allowed to access without authentication
  if (event.path === '/login' || event.path === '/api/login') {
    console.log('[Nuxt Users] server.middleware.auth.global: /login')
    return
  }

  // whitelisted paths are allowed to access without authentication
  if (options.auth.whitelist.includes(event.path)) {
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

  console.log(`[Nuxt Users] server.middleware.auth.global: Authenticated request for ${user.id}`)
  return
})
