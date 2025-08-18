import { defineEventHandler, readBody, createError, H3Error } from 'h3'
import { resetPassword } from '../../../services/password' // Adjusted path
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { validatePassword, getPasswordValidationOptions } from '../../../../../utils'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { token, email, password, password_confirmation } = body

  if (!email || typeof email !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Email is required.' })
  }
  if (!password || typeof password !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Password is required.' })
  }
  if (password !== password_confirmation) {
    throw createError({ statusCode: 400, statusMessage: 'Passwords do not match.' })
  }
  try {
    const options = useRuntimeConfig().nuxtUsers as ModuleOptions
    const passwordOptions = getPasswordValidationOptions(options)
    const passwordValidation = validatePassword(password, passwordOptions)
    if (!passwordValidation.isValid) {
      throw createError({
        statusCode: 400,
        statusMessage: `Password validation failed: ${passwordValidation.errors.join(', ')}`
      })
    }

    const success = await resetPassword(token, email, password, options)

    if (success) {
      return { message: 'Password has been reset successfully. You can now log in with your new password.' }
    }
    else {
      throw createError({
        statusCode: 400, // Or 422 if you prefer for semantic validation errors
        statusMessage: 'Invalid or expired token, or email mismatch. Please request a new password reset link.',
      })
    }
  }
  catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[Nuxt Users] Error in reset-password endpoint:', error.message)
    }
    else {
      console.error('[Nuxt Users] Error in reset-password endpoint:', error)
    }
    // If it's a known error from resetPassword, it might already be an H3Error
    if (error instanceof H3Error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'An internal server error occurred.',
    })
  }
})
