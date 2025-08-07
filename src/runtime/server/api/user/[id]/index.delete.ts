import { createError, defineEventHandler, getCookie } from 'h3'
import type { ModuleOptions } from '../../../../types'
import { useRuntimeConfig } from '#imports'
import { deleteUser, getCurrentUserFromToken } from '../../../utils/user'
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

  // Check if the user has permission to delete users (admin role)
  if (!hasPermission(currentUser.role, event.path, options.auth.permissions)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }

  try {
    // Delete the user
    await deleteUser(userId, options)

    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error deleting user: ${error.message}`
    })
  }
})
