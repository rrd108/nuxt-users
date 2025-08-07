import { createError, defineEventHandler, getCookie, readBody } from 'h3'
import type { ModuleOptions } from '../../../../types'
import { useRuntimeConfig } from '#imports'
import { createUser, getCurrentUserFromToken } from '../../utils/user'
import { hasPermission } from '../../../utils/permissions'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  // Check if the user is authenticated
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Get the current user
  const user = await getCurrentUserFromToken(token, options)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Check if the user has permission to create users (admin role)
  if (!hasPermission(user.role, event.path, options.auth.permissions)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

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
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error creating user: ${error.message}`
    })
  }
})
