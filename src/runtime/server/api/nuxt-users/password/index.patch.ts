import { createError, defineEventHandler, readBody } from 'h3'
import bcrypt from 'bcrypt'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { requireSessionUser, findUserById, updateUserPassword, endOtherSessions } from '../../../utils'
import { validatePassword, getPasswordValidationOptions } from '../../../../../utils'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  const sessionUser = await requireSessionUser(event, options)
  // The password hash is never kept in the session, so it is read here
  const user = await findUserById(sessionUser.id, options, true)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Invalid authentication token'
    })
  }

  const body = await readBody(event)
  const { currentPassword, newPassword, newPasswordConfirmation } = body

  // Validate input
  if (!currentPassword || typeof currentPassword !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password is required'
    })
  }

  if (!newPassword || typeof newPassword !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password is required'
    })
  }

  if (newPassword !== newPasswordConfirmation) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password confirmation does not match'
    })
  }

  // Validate password strength
  const passwordOptions = getPasswordValidationOptions(options)
  const passwordValidation = validatePassword(newPassword, passwordOptions)
  if (!passwordValidation.isValid) {
    throw createError({
      statusCode: 400,
      statusMessage: `Password validation failed: ${passwordValidation.errors.join(', ')}`
    })
  }

  // Verify current password
  const currentPasswordMatch = await bcrypt.compare(currentPassword, user.password)
  if (!currentPasswordMatch) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password is incorrect'
    })
  }

  // Update the password
  await updateUserPassword(user.email, newPassword, options)

  // Log out all other sessions, keep the current one
  await endOtherSessions(event, user.id, options)

  return { message: 'Password updated successfully' }
})
