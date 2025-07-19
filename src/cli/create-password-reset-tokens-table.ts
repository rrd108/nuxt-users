import { useRuntimeConfig } from '#imports'
import { createPasswordResetTokensTable } from '../runtime/server/utils/create-password-reset-tokens-table'
import type { ModuleOptions } from '../types'

const migrateDefault = async () => {
  console.log('[Nuxt Users] Starting migration...')

  const options = useRuntimeConfig().nuxtUsers as ModuleOptions

  try {
    await createPasswordResetTokensTable(options)
    process.exit(0)
  }
  catch (error) {
    console.error('[DB:Create Password Reset Tokens Table] Error:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (process.argv[1] && process.argv[1].endsWith('create-password-reset-tokens-table.ts')) {
  migrateDefault()
}
