import { createError, defineEventHandler } from 'h3'
import type { ModuleOptions } from '../../../../types'
import { useRuntimeConfig } from '#imports'
import { findUserById } from '../../utils/user'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  const userId = Number(event.context.params?.id)

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID'
    })
  }

  // Authentication and authorization are handled by middleware
  // The current user is available via the middleware

  try {
    // Fetch the user by ID
    const user = await findUserById(userId, options)

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    return { user }
  }
  catch (error: unknown) {
    // Re-throw known HTTP errors (e.g., those created via createError)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error as unknown as Error
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Error fetching user: ${error instanceof Error ? error.message : String(error)}`
    })
  }
})
