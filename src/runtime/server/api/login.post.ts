import { createError, defineEventHandler, readBody, setCookie } from 'h3'
import bcrypt from 'bcrypt'
import crypto from 'node:crypto'
import type { ModuleOptions, User } from '../../../types'
import { useRuntimeConfig } from '#imports'
import { useDb } from '../utils'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

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

  // Store the token in the personal_access_tokens table
  // Assuming user.id is the primary key of the users table
  await db.sql`
    INSERT INTO {${personalAccessTokensTable}} (tokenable_type, tokenable_id, name, token, created_at, updated_at)
    VALUES ('user', ${user.id}, ${tokenName}, ${token}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `

  // Set the cookie
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'lax', // Adjust as needed
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  // Return user without password for security
  const { password: _, ...userWithoutPassword } = user
  return { user: userWithoutPassword }
})
