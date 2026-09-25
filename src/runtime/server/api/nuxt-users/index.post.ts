import { createError, defineEventHandler, readBody } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { createUser } from '../../utils'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  // Authentication and authorization are handled by middleware
  // The current user is available via the middleware

  // Get the request body
  const body = await readBody(event)

  // Validate the request body
  if (!body.email || !body.name || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: email, name, password'
    })
  }

  try {
    // Create the new user (admin-only endpoint; role is validated against permissions)
    const newUser = await createUser({
      email: body.email,
      name: body.name,
      password: body.password,
      role: body.role
    }, options)

    return { user: newUser }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    const message = error?.message || 'Unknown error'
    const isClientError = typeof message === 'string' && (
      message.startsWith('Invalid role')
      || message.startsWith('Role ')
      || message.startsWith('Password validation')
    )

    throw createError({
      statusCode: isClientError ? 400 : 500,
      statusMessage: `Error creating user: ${message}`
    })
  }
})
