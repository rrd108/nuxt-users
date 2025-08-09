import { defineEventHandler, readBody, createError } from 'h3'
import { sendPasswordResetLink } from '../../../services/password'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  if (!email || typeof email !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required and must be a string.',
    })
  }

  try {
    await sendPasswordResetLink(email, event.context.nuxtUsers)
    // Always return a success-like message to prevent email enumeration
    return { message: 'If a user with that email exists, a password reset link has been sent.' }
  }
  catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[Nuxt Users] Error in forgot-password endpoint:', error.message)
    }
    else {
      console.error('[Nuxt Users] Error in forgot-password endpoint:', error)
    }
    // Do not reveal specific errors to the client to prevent enumeration or info leaks
    throw createError({
      statusCode: 500,
      statusMessage: 'An internal server error occurred.',
    })
  }
})
