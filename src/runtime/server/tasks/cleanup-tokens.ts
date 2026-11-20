import { defineTask } from 'nitropack/runtime/task'
import type { ModuleOptions } from 'nuxt-users/utils'

interface CleanupTokensPayload {
  includeNoExpiration?: boolean
}

export default defineTask({
  meta: {
    name: 'nuxt-users:cleanup-tokens',
    description: 'Clean up expired personal access tokens and tokens without expiration'
  },
  async run({ payload }: { payload?: CleanupTokensPayload }) {
    const { useRuntimeConfig } = await import('#imports')
    const { cleanupPersonalAccessTokens, deleteExpiredPasskeyChallenges } = await import('../utils')

    const { nuxtUsers } = useRuntimeConfig()
    const options = nuxtUsers as ModuleOptions

    if (!options) {
      throw new Error('Nuxt Users module not configured')
    }

    // Payload options: { includeNoExpiration?: boolean }
    const includeNoExpiration = payload?.includeNoExpiration ?? true

    try {
      const result = await cleanupPersonalAccessTokens(options, includeNoExpiration)
      // Expired passkey challenges are only stored when passkeys are used; the table may not exist yet
      await deleteExpiredPasskeyChallenges(options).catch(() => 0)

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
