import { createError, defineEventHandler, getCookie } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getCurrentUserFromToken } from '../../utils'
import type { UserWithoutPassword, ModuleOptions } from 'nuxt-users/utils'

export default defineEventHandler(async (event) => {
  // The authorization middleware has already validated the token and stored the user
  // in event.context.nuxtUsers.user. Use it to avoid double validation.
  if (!event.context) {
    event.context = {}
  }
  let user = event.context.nuxtUsers?.user as UserWithoutPassword | undefined

  // Fallback: if context doesn't have user, validate token directly
  // This allows the endpoint to work in tests or if middleware hasn't run
  if (!user) {
    const token = getCookie(event, 'auth_token')
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - No authentication token found'
      })
    }

    const { nuxtUsers } = useRuntimeConfig()
    const options = nuxtUsers as ModuleOptions
    const validatedUser = await getCurrentUserFromToken(token, options)

    if (!validatedUser) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Invalid authentication token'
      })
    }

    // getCurrentUserFromToken already returns UserWithoutPassword (no password field)
    user = validatedUser
  }

  return { user }
})
