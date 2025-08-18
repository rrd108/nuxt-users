import { createError, defineEventHandler, getQuery } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { useDb } from '../../utils/db'
import { getLastLoginTime } from '../../utils/user'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  const db = await useDb(options)
  const usersTable = options.tables.users

  // Get query parameters for pagination
  const query = getQuery(event)
  const page = Number(query.page as string) || 1
  const limit = Number(query.limit as string) || 10
  const offset = (page - 1) * limit

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.'
    })
  }

  try {
    // Get total count for pagination
    const countResult = await db.sql`SELECT COUNT(*) as total FROM {${usersTable}} WHERE active = TRUE` as { rows: Array<{ total: number }> }
    const total = countResult.rows[0].total

    // Get users with pagination (excluding passwords)
    const usersResult = await db.sql`
      SELECT id, email, name, role, created_at, updated_at 
      FROM {${usersTable}} 
      WHERE active = TRUE
      ORDER BY name ASC 
      LIMIT ${limit} OFFSET ${offset}
    ` as { rows: Array<{ id: number, email: string, name: string, role: string, created_at: string | Date, updated_at: string | Date }> }

    const users = await Promise.all(usersResult.rows.map(async (user) => {
      const lastLoginTime = await getLastLoginTime(user.id, options)

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
        updated_at: user.updated_at instanceof Date ? user.updated_at.toISOString() : user.updated_at,
        last_login_at: lastLoginTime
      }
    }))

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  }
  catch (error: unknown) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error fetching users: ${error instanceof Error ? error.message : String(error)}`
    })
  }
})
