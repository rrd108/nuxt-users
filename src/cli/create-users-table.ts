#!/usr/bin/env tsx

import { createUsersTable } from '../runtime/server/utils/create-users-table'
import { getOptionsFromEnv } from './utils'

const migrateDefault = async () => {
  console.log('[Nuxt Users] Creating users table...')

  const options = getOptionsFromEnv()

  try {
    await createUsersTable(options)
    console.log('[Nuxt Users] Users table created successfully!')
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
