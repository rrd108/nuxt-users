#!/usr/bin/env tsx

import { createPersonalAccessTokensTable } from '../runtime/server/utils/create-personal-access-tokens-table'
import { getOptionsFromEnv } from './utils'

const migrateDefault = async () => {
  console.log('[Nuxt Users] Creating personal access tokens table...')

  const options = getOptionsFromEnv()

  try {
    await createPersonalAccessTokensTable(options)
    console.log('[Nuxt Users] Personal access tokens table created successfully!')
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
