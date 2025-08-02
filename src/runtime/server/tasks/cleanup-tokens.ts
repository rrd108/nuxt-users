import { defineTask } from 'nitropack/runtime/task'
import type { ModuleOptions } from '../../../types'

export default defineTask({
  meta: {
    name: 'nuxt-users:cleanup-tokens',
    description: 'Clean up expired personal access tokens and tokens without expiration'
  },
  async run({ payload }) {
    const { useRuntimeConfig } = await import('#imports')
    const { cleanupPersonalAccessTokens } = await import('../utils')

    const { nuxtUsers } = useRuntimeConfig()
    const options = nuxtUsers as ModuleOptions

    if (!options) {
      throw new Error('Nuxt Users module not configured')
    }

    // Payload options: { includeNoExpiration?: boolean }
    const includeNoExpiration = (payload?.includeNoExpiration as boolean) ?? true

    try {
      const result = await cleanupPersonalAccessTokens(options, includeNoExpiration)

      return {
        result: 'success',
        expiredTokensRemoved: result.expiredCount,
        noExpirationTokensRemoved: result.noExpirationCount,
        totalTokensCleaned: result.totalCount,
        includeNoExpiration
      }
    }
    catch (error) {
      console.error('[Nuxt Users] Token cleanup failed:', error)
      throw error
    }
  }
})
