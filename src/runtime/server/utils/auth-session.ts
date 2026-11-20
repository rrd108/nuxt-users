import { setCookie } from 'h3'
import type { H3Event } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'

/**
 * Sets the auth cookie for a freshly issued token. Shared by every login method (password, passkey),
 * so they all end up with the same session behaviour: "remember me" gets a long-lived cookie,
 * a regular login a session cookie.
 */
export const setAuthCookie = (event: H3Event, token: string, options: ModuleOptions, rememberMe = false) => {
  const cookieOptions: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'lax'
    path: string
    maxAge?: number
  } = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  }

  if (rememberMe) {
    const longTermDays = options.auth.rememberMeExpiration || 30
    cookieOptions.maxAge = 60 * 60 * 24 * longTermDays
  }

  setCookie(event, 'auth_token', token, cookieOptions)
}
