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
      // Expired passkey challenges are only stored when passkeys are used. A failure here must not
      // fail the token cleanup, but it is logged so a broken challenge table does not go unnoticed.
      await deleteExpiredPasskeyChallenges(options).catch((error) => {
        console.warn('[Nuxt Users] Passkey challenge cleanup failed:', error)
      })

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
