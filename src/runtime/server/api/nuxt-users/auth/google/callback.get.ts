import { defineEventHandler, sendRedirect, createError, getQuery, setCookie } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { 
  createGoogleOAuth2Client, 
  getGoogleUserFromCode, 
  findOrCreateGoogleUser,
  createAuthTokenForUser 
} from '../../../../utils/google-oauth'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  const query = getQuery(event)

  // Check if Google OAuth is configured
  if (!options.auth.google) {
    return sendRedirect(event, options.auth.google?.errorRedirect || '/login?error=oauth_not_configured')
  }

  // Handle OAuth errors
  if (query.error) {
    console.error('[Nuxt Users] Google OAuth error:', query.error)
    const errorRedirect = options.auth.google.errorRedirect || '/login?error=oauth_failed'
    return sendRedirect(event, errorRedirect)
  }

  // Check for authorization code
  if (!query.code || typeof query.code !== 'string') {
    console.error('[Nuxt Users] Missing authorization code in OAuth callback')
    const errorRedirect = options.auth.google.errorRedirect || '/login?error=oauth_failed'
    return sendRedirect(event, errorRedirect)
  }

  try {
    // Construct the callback URL
    const baseUrl = getRequestURL(event).origin
    const callbackPath = options.auth.google.callbackUrl || `${options.apiBasePath}/auth/google/callback`
    const callbackUrl = `${baseUrl}${callbackPath}`

    // Create OAuth2 client
    const oauth2Client = createGoogleOAuth2Client(options.auth.google, callbackUrl)

    // Exchange code for user info
    const googleUser = await getGoogleUserFromCode(oauth2Client, query.code)

    // Find or create user in database
    const user = await findOrCreateGoogleUser(googleUser, options)

    // Check if user account is active
    if (!user.active) {
      console.warn(`[Nuxt Users] Inactive user attempted Google OAuth login: ${user.email}`)
      const errorRedirect = options.auth.google.errorRedirect || '/login?error=account_inactive'
      return sendRedirect(event, errorRedirect)
    }

    // Create authentication token - default to remember me for OAuth users
    const token = await createAuthTokenForUser(user, options, true)

    // Set authentication cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * (options.auth.rememberMeExpiration || 30) // 30 days default
    }

    setCookie(event, 'auth_token', token, cookieOptions)

    // Update last login time
    const { useDb } = await import('../../../../utils/db')
    const db = await useDb(options)
    await db.sql`
      UPDATE {${options.tables.users}} 
      SET last_login_at = CURRENT_TIMESTAMP 
      WHERE id = ${user.id}
    `

    console.log(`[Nuxt Users] Google OAuth login successful for user: ${user.email}`)

    // Redirect to success page
    const successRedirect = options.auth.google.successRedirect || '/'
    return sendRedirect(event, successRedirect)

  } catch (error) {
    console.error('[Nuxt Users] Google OAuth callback error:', error)
    const errorRedirect = options.auth.google?.errorRedirect || '/login?error=oauth_failed'
    return sendRedirect(event, errorRedirect)
  }
})

// Helper function to get request URL
function getRequestURL(event: any) {
  const headers = event.node.req.headers
  const host = headers.host || headers[':authority']
  const protocol = headers['x-forwarded-proto'] || (event.node.req.socket?.encrypted ? 'https' : 'http')
  return new URL(`${protocol}://${host}`)
}