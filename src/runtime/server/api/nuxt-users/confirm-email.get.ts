import { defineEventHandler, getQuery, sendRedirect } from 'h3'
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
      const redirectUrl = new URL(options.emailConfirmationUrl, 'http://localhost')
      redirectUrl.searchParams.set('status', 'error')
      redirectUrl.searchParams.set('message', 'Token and email are required')
      return sendRedirect(event, redirectUrl.pathname + redirectUrl.search, 302)
    }

    const token = String(query.token)
    const email = String(query.email)

    const success = await confirmUserEmail(token, email, options)

    if (success) {
      // Redirect to success page with success status
      const redirectUrl = new URL(options.emailConfirmationUrl, 'http://localhost')
      redirectUrl.searchParams.set('status', 'success')
      redirectUrl.searchParams.set('message', 'Email confirmed successfully! Your account is now active. You can now log in.')
      return sendRedirect(event, redirectUrl.pathname + redirectUrl.search, 302)
    }
    else {
      // Redirect to error page with error status
      const redirectUrl = new URL(options.emailConfirmationUrl, 'http://localhost')
      redirectUrl.searchParams.set('status', 'error')
      redirectUrl.searchParams.set('message', 'Invalid or expired confirmation token')
      return sendRedirect(event, redirectUrl.pathname + redirectUrl.search, 302)
    }
  }
  catch (error) {
    console.error('[Nuxt Users] Email confirmation error:', error)

    const { nuxtUsers } = useRuntimeConfig()
    const options = nuxtUsers as ModuleOptions

    // Redirect to error page with error details
    const redirectUrl = new URL(options.emailConfirmationUrl, 'http://localhost')
    redirectUrl.searchParams.set('status', 'error')

    if (error instanceof Error) {
      redirectUrl.searchParams.set('message', error.message)
    }
    else {
      redirectUrl.searchParams.set('message', 'Email confirmation failed')
    }

    return sendRedirect(event, redirectUrl.pathname + redirectUrl.search, 302)
  }
})
