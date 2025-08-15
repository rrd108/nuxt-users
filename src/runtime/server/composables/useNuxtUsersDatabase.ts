/**
 * Server-side utility to access the nuxt-users module's database connection
 * This provides access to the same database instance used by the module
 * for user authentication, tokens, etc.
 *
 * Usage in server-side code (API routes, server middleware):
 * ```typescript
 * export default defineEventHandler(async (event) => {
 *   const { database } = await useNuxtUsersDatabase()
 *   const users = await database.sql`SELECT * FROM my_table`
 * })
 * ```
 *
 * Note: This is a server-side only utility and should not be used in client-side code
 */
import type { ModuleOptions } from '#nuxt-users/types'

export const useNuxtUsersDatabase = async () => {
  // This will be available at runtime when used in a Nuxt application
  const { useRuntimeConfig } = await import('#imports')
  const { useDb } = await import('../utils/db')

  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  const database = await useDb(options)

  return {
    database,
    options: {
      tables: options.tables,
      connector: options.connector
    }
  }
}
