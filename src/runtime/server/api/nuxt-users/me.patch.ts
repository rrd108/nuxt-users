import { createError, defineEventHandler, readBody } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { updateUser } from '../../utils/user'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  // The user is authenticated by the server middleware and available in the event context.
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)

  // Users should not be able to change their role via this endpoint.
  if (body.role) {
    delete body.role
  }

  try {
    const updatedUser = await updateUser(user.id, body, options)
    return { user: updatedUser }
  }
  catch (error: unknown) {
    if (error instanceof Error) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message
      })
    }
    throw createError({
      statusCode: 400,
      statusMessage: 'An unknown error occurred'
    })
  }
})
