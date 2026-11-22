import type { H3Event } from 'h3'
import { getSessionUser } from '../utils'
import type { ModuleOptions, UserWithoutPassword } from 'nuxt-users/utils'

/**
 * Server-side composable for authentication utilities
 *
 * @example
 * ```typescript
 * // server/api/protected-route.get.ts
 * export default defineEventHandler(async (event) => {
 *   const { getCurrentUser } = useServerAuth()
 *   const user = await getCurrentUser(event)
 *
 *   if (!user) {
 *     throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
 *   }
 *
 *   return { message: `Hello ${user.name}!` }
 * })
 * ```
 */
export const useServerAuth = () => {
  /** The user of the request's session, or null. Reuses the user the authorization middleware already resolved. */
  const getCurrentUser = async (event: unknown): Promise<UserWithoutPassword | null> => {
    // This will be available at runtime when used in a Nuxt application
    const { useRuntimeConfig } = await import('#imports')
    const { nuxtUsers } = useRuntimeConfig()
    return getSessionUser(event as H3Event, nuxtUsers as ModuleOptions)
  }

  return {
    getCurrentUser
  }
}
