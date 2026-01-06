import { createError, defineEventHandler } from 'h3'
import type { UserWithoutPassword } from 'nuxt-users/utils'

export default defineEventHandler(async (event) => {
  // The authorization middleware has already validated the token and stored the user
  // in event.context.nuxtUsers.user. Use it to avoid double validation.
  const user = event.context.nuxtUsers?.user as UserWithoutPassword | undefined

  if (!user) {
    // This should not happen if middleware is working correctly, but handle it gracefully
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - No authenticated user found'
    })
  }

  return { user }
})
