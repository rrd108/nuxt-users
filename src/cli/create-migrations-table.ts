#!/usr/bin/env tsx

import { createMigrationsTable } from '../runtime/server/utils/create-migrations-table'
import { getOptionsFromEnv } from './utils'

const migrateDefault = async () => {
  console.log('[Nuxt Users] Creating migrations table...')

  const options = getOptionsFromEnv()

  try {
    await createMigrationsTable(options)
    console.log('[Nuxt Users] Migrations table created successfully!')
    process.exit(0)
  }
  catch (error) {
    console.error('[DB:Create Migrations Table] Error:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (process.argv[1] && process.argv[1].endsWith('create-migrations-table.ts')) {
  migrateDefault()
}
