import { getCurrentUserFromToken } from '../utils/user'
import type { ModuleOptions, UserWithoutPassword } from '../../../types'

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
  const getCurrentUser = async (event: unknown): Promise<UserWithoutPassword | null> => {
    // This will be available at runtime when used in a Nuxt application
    const { useRuntimeConfig } = await import('#imports')
    const { getCookie } = await import('h3')

    // Get the auth token from cookies
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = getCookie(event as any, 'auth_token')

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
