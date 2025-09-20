import { createError, defineEventHandler, readBody, setCookie } from 'h3'
import bcrypt from 'bcrypt'
import crypto from 'node:crypto'
import type { ModuleOptions, User } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { useDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, rememberMe } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  const db = await useDb(options)
  const usersTable = options.tables.users
  const personalAccessTokensTable = options.tables.personalAccessTokens

  const userResult = await db.sql`SELECT * FROM {${usersTable}} WHERE email = ${email}` as { rows: User[] }

  if (userResult.rows.length === 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  const user = userResult.rows[0]
  if (!user.active) {
    throw createError({
      statusCode: 403,
      statusMessage: 'User account is inactive',
    })
  }

  const storedPassword = user.password
  const passwordMatch = await bcrypt.compare(password, storedPassword)

  if (!passwordMatch) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  // Generate a secure token
  const token = crypto.randomBytes(64).toString('hex')
  const tokenName = 'auth_token' // Or any other meaningful name

  // Calculate expiration time based on module options and rememberMe setting
  const expiresAt = new Date()
  if (rememberMe) {
    // For "remember me" sessions, use a longer expiration (30 days default)
    const longTermDays = options.auth.rememberMeExpiration || 30 // days
    expiresAt.setDate(expiresAt.getDate() + longTermDays)
  }
  else {
    // For regular sessions, use the configured token expiration
    expiresAt.setMinutes(expiresAt.getMinutes() + options.auth.tokenExpiration)
  }

  // Store the token in the personal_access_tokens table
  // Assuming user.id is the primary key of the users table
  await db.sql`
    INSERT INTO {${personalAccessTokensTable}} (tokenable_type, tokenable_id, name, token, expires_at, created_at, updated_at)
    VALUES ('user', ${user.id}, ${tokenName}, ${token}, ${expiresAt.toISOString().slice(0, 19).replace('T', ' ')}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `

  // Set the cookie with appropriate expiration based on rememberMe
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'lax' as const, // Adjust as needed
    path: '/',
  }

  if (rememberMe) {
    // For "remember me", set a long-term cookie
    const longTermDays = options.auth.rememberMeExpiration || 30
    cookieOptions.maxAge = 60 * 60 * 24 * longTermDays // Convert days to seconds
  }
  else {
    // For regular login, don't set maxAge to create a session cookie
    // Session cookies expire when the browser is closed
  }

  setCookie(event, 'auth_token', token, cookieOptions)

  // Return user without password for security
  const { password: _, ...userWithoutPassword } = user
  return { user: userWithoutPassword }
})
