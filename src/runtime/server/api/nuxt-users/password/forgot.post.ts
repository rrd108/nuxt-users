import { defineEventHandler, readBody, createError, getHeader } from 'h3'
import { sendPasswordResetLink } from '../../../services/password'
import { useRuntimeConfig } from '#imports'
import type { ModuleOptions } from 'nuxt-users/utils'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  const body = await readBody(event)
  const { email } = body

  if (!email || typeof email !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required and must be a string.',
    })
  }

  try {
    // Try to determine the base URL from the request
    const host = getHeader(event, 'host')
    const protocol = getHeader(event, 'x-forwarded-proto') || 'http'
    const baseUrl = host ? `${protocol}://${host}` : undefined

    await sendPasswordResetLink(email, options, baseUrl)
    // Always return a success-like message to prevent email enumeration
    return { message: 'If a user with that email exists, a password reset link has been sent.' }
  }
  catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[Nuxt Users] Error in forgot-password endpoint:', error.message)
    }
    if (!(error instanceof Error)) {
      console.error('[Nuxt Users] Error in forgot-password endpoint:', error)
    }
    // Do not reveal specific errors to the client to prevent enumeration or info leaks
    throw createError({
      statusCode: 500,
      statusMessage: 'An internal server error occurred.',
    })
  }
})
