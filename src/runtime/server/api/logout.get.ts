import { defineEventHandler, getCookie, setCookie } from 'h3'
import type { ModuleOptions } from '../../../types'
import { useRuntimeConfig } from '#imports'
import { useDb } from '../utils'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  const db = await useDb(options)
  const personalAccessTokensTable = options.tables.personalAccessTokens

  // Get the auth token from the cookie
  const token = getCookie(event, 'auth_token')

  if (token) {
    // Delete the token from the database
    await db.sql`DELETE FROM {${personalAccessTokensTable}} WHERE token = ${token}`
  }

  // Clear the auth cookie
  setCookie(event, 'auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })

  return { message: 'Logged out successfully' }
})
