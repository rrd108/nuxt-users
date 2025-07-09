import { createDatabase } from 'db0'
import { getConnector } from './db'
import type { ModuleOptions } from '../../../types'

export const createPasswordResetTokensTable = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))

  const tableName = 'password_reset_tokens'

  console.log(`[DB:Create Password Reset Tokens Table] Creating ${tableName} table with ${connectorName} connector...`)

  await db.sql`
    CREATE TABLE IF NOT EXISTS ${db.raw(tableName)} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
  // Creating an index on email for faster lookups
  await db.sql`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON ${db.raw(tableName)} (email)`
  // Creating an index on token for faster lookups
  await db.sql`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON ${db.raw(tableName)} (token)`

  console.log(`[DB:Create Password Reset Tokens Table] ${tableName} table created successfully!`)
  console.log(`[DB:Create Password Reset Tokens Table] Fields: id, email, token, created_at`)

  console.log('[DB:Create Password Reset Tokens Table] Migration completed successfully!')
}

// Default options - you can override these with environment variables
const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/db.sqlite3',
    },
  },
  tables: {
    users: false, // Not directly used by this script but part of ModuleOptions
    personalAccessTokens: false, // Not directly used by this script
    passwordResetTokens: true,
  },
}

const migrateDefault = async () => {
  console.log('[Nuxt Users] Starting migration for password_reset_tokens table...')

  try {
    await createPasswordResetTokensTable(defaultOptions)
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
