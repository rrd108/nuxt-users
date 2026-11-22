import { createError, defineEventHandler, readBody } from 'h3'
import bcrypt from 'bcrypt'
import type { ModuleOptions, User } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { useDb, startSession } from '../../../utils'

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

  const userResult = await db.sql`SELECT * FROM {${usersTable}} WHERE email = ${email}` as { rows: User[] }

  if (userResult.rows.length === 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  const user = userResult.rows[0]
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
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

  await startSession(event, user, 'password', options, Boolean(rememberMe))

  // Return user without password for security
  const { password: _, ...userWithoutPassword } = user
  return { user: userWithoutPassword }
})
