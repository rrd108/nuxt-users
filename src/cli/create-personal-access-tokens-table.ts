import { useRuntimeConfig } from '#imports'
import { createPersonalAccessTokensTable } from '../runtime/server/utils/create-personal-access-tokens-table'
import type { ModuleOptions } from '../types'

const migrateDefault = async () => {
  console.log('[Nuxt Users] Starting migration...')

  const options = useRuntimeConfig().nuxtUsers as ModuleOptions

  try {
    await createPersonalAccessTokensTable(options)
    process.exit(0)
  }
  catch (error) {
    console.error('[DB:Create Personal Access Tokens Table] Error:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (process.argv[1] && process.argv[1].endsWith('create-personal-access-tokens-table.ts')) {
  migrateDefault()
}
