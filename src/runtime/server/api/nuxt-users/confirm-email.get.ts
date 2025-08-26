import { createError, defineEventHandler, getQuery } from 'h3'
import { useRuntimeConfig } from '#imports'
import { confirmUserEmail } from '../../services/registration'
import type { ModuleOptions } from 'nuxt-users/utils'

export default defineEventHandler(async (event) => {
  try {
    const { nuxtUsers } = useRuntimeConfig()
    const options = nuxtUsers as ModuleOptions
    const query = getQuery(event)

    // Validate required parameters
    if (!query.token || !query.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Token and email are required'
      })
    }

    const token = String(query.token)
    const email = String(query.email)

    const success = await confirmUserEmail(token, email, options)

    if (success) {
      // Redirect to a success page or login page
      // For now, return a success response
      return {
        success: true,
        message: 'Email confirmed successfully! Your account is now active. You can now log in.'
      }
    }
    else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired confirmation token'
      })
    }
  }
  catch (error) {
    console.error('[Nuxt Users] Email confirmation error:', error)

    if (error instanceof Error) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Email confirmation failed'
    })
  }
})
