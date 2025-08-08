import { createError, defineEventHandler, readBody } from 'h3'
import type { ModuleOptions } from '../../../../types'
import { useRuntimeConfig } from '#imports'
import { createUser } from '../../utils/user'

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
    // Create the new user
    const newUser = await createUser({
      email: body.email,
      name: body.name,
      password: body.password,
      role: body.role // role is optional
    }, options)

    return { user: newUser }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error creating user: ${error.message}`
    })
  }
})
