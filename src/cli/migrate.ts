#!/usr/bin/env tsx

import { runMigrations } from '../runtime/server/utils/migrate'
import { getOptionsFromEnv } from './utils'

const migrateDefault = async () => {
  console.log('[Nuxt Users] Starting migration system...')

  const options = getOptionsFromEnv()

  try {
    await runMigrations(options)
    console.log('[Nuxt Users] Migration completed successfully!')
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
