import { createError, defineEventHandler, getCookie } from 'h3'
import type { ModuleOptions } from '../../../types'
import { useRuntimeConfig } from '#imports'
import { getCurrentUserFromToken } from '../../../utils/user'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  // Get the auth token from the cookie
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - No authentication token found'
    })
  }

  // Get the current user from the token
  const user = await getCurrentUserFromToken(token, options)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Invalid authentication token'
    })
  }

  // Return user without password for security
  const { password: _, ...userWithoutPassword } = user
  return { user: userWithoutPassword }
})
