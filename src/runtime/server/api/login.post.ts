import { createError, defineEventHandler, readBody } from 'h3'
import { getConnector } from '../utils/db'
import { createDatabase } from 'db0'
import bcrypt from 'bcrypt'
import type { ModuleOptions } from '../../../types'

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

  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))

  const user = await db.sql`SELECT * FROM users WHERE email = ${email}` as any

  if (user.rows.length === 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  const storedPassword = user.rows[0].password
  const passwordMatch = await bcrypt.compare(password, storedPassword)

  if (!passwordMatch) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  // For now, just return a success message
  // In a real application, you would return a JWT or session token here
  return { user: user.rows[0] }
})
