import { useRuntimeConfig } from '#imports'
import { runMigrations } from '../runtime/server/utils/migrate'
import type { ModuleOptions } from '../types'

const migrateDefault = async () => {
  console.log('[Nuxt Users] Starting migration system...')

  const options = useRuntimeConfig().nuxtUsers as ModuleOptions

  try {
    await runMigrations(options)
    process.exit(0)
  }
  catch (error) {
    console.error('[Nuxt Users] Migration failed:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  migrateDefault()
}
