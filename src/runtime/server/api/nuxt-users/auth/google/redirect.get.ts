import { defineEventHandler, sendRedirect, createError } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { createGoogleOAuth2Client, getGoogleAuthUrl } from '../../../utils/google-oauth'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  // Check if Google OAuth is configured
  if (!options.auth.google) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Google OAuth is not configured'
    })
  }

  if (!options.auth.google.clientId || !options.auth.google.clientSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Google OAuth client ID and secret are required'
    })
  }

  try {
    // Construct the callback URL
    const baseUrl = getRequestURL(event).origin
    const callbackPath = options.auth.google.callbackUrl || `${options.apiBasePath}/auth/google/callback`
    const callbackUrl = `${baseUrl}${callbackPath}`

    // Create OAuth2 client and generate auth URL
    const oauth2Client = createGoogleOAuth2Client(options.auth.google, callbackUrl)
    const authUrl = getGoogleAuthUrl(oauth2Client, options.auth.google)

    // Redirect to Google OAuth
    return sendRedirect(event, authUrl)
    
  } catch (error) {
    console.error('[Nuxt Users] Google OAuth redirect error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to initiate Google OAuth'
    })
  }
})

// Helper function to get request URL
function getRequestURL(event: any) {
  const headers = event.node.req.headers
  const host = headers.host || headers[':authority']
  const protocol = headers['x-forwarded-proto'] || (event.node.req.socket?.encrypted ? 'https' : 'http')
  return new URL(`${protocol}://${host}`)
}