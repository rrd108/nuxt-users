import { createPasswordResetTokensTable } from '../runtime/server/utils/create-password-reset-tokens-table'
import { getOptionsFromEnv } from './utils'

const migrateDefault = async () => {
  console.log('[Nuxt Users] Creating password reset tokens table...')

  const options = getOptionsFromEnv()

  try {
    await createPasswordResetTokensTable(options)
    console.log('[Nuxt Users] Password reset tokens table created successfully!')
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
