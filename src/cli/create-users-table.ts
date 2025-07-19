import { useRuntimeConfig } from '#imports'
import { createUsersTable } from '../runtime/server/utils/create-users-table'
import type { ModuleOptions } from '../types'

const migrateDefault = async () => {
  console.log('[Nuxt Users] Starting migration...')

  const options = useRuntimeConfig().nuxtUsers as ModuleOptions

  try {
    await createUsersTable(options)
    process.exit(0)
  }
  catch (error) {
    console.error('[DB:Create Users Table] Error:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (process.argv[1] && process.argv[1].endsWith('create-users-table.ts')) {
  migrateDefault()
}
