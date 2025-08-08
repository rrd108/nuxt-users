import { createError, defineEventHandler, readBody } from 'h3'
import type { ModuleOptions } from '../../../../types'
import { useRuntimeConfig } from '#imports'
import { updateUser } from '../../utils/user'

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

  // Get the request body
  const body = await readBody(event)

  try {
    // Update the user
    const updatedUser = await updateUser(userId, body, options)

    return { user: updatedUser }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error updating user: ${error.message}`
    })
  }
})
