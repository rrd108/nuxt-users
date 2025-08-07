import { createError, defineEventHandler, getCookie } from 'h3'
import type { ModuleOptions, UserWithoutPassword } from '../../../../types'
import { useRuntimeConfig } from '#imports'
import { findUserById, getCurrentUserFromToken } from '../../../utils/user'
import { hasPermission } from '../../../../utils/permissions'

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

  // Check if the user is authenticated
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Get the current user
  const currentUser = await getCurrentUserFromToken(token, options)
  if (!currentUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // Check if the user is requesting their own data or is an admin
  const isAdmin = hasPermission(currentUser.role, event.path, options.auth.permissions)
  if (currentUser.id !== userId && !isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

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
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error fetching user: ${error.message}`
    })
  }
})
