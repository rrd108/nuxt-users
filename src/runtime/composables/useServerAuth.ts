import { getCurrentUserFromToken } from '../server/utils/user'
import { getCookie, type H3Event } from 'h3'
import type { ModuleOptions, UserWithoutPassword } from '../../types'

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
  const getCurrentUser = async (event: H3Event): Promise<UserWithoutPassword | null> => {
    // This will be available at runtime when used in a Nuxt application
    const { useRuntimeConfig } = await import('#imports')
    // Get the auth token from cookies
    const token = getCookie(event, 'auth_token')

    if (!token) {
      return null
    }

    // Get the module options from runtime config
    const { nuxtUsers } = useRuntimeConfig()

    // Get the current user using the token
    const user = await getCurrentUserFromToken(token, nuxtUsers as ModuleOptions, false)
    return user
  }

  return {
    getCurrentUser
  }
}
