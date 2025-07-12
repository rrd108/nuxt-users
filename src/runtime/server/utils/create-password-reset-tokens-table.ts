import { createDatabase } from 'db0'
import { getConnector } from './db'
import type { ModuleOptions } from '../../../types'

export const createPasswordResetTokensTable = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))

  const tableName = options.tables.passwordResetTokens

  console.log(`[DB:Create Password Reset Tokens ${connectorName} Table] Creating ${tableName} table with ${connectorName} connector...`)

  if (connectorName === 'sqlite') {
    await db.sql`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
  }
  if (connectorName === 'mysql') {
    await db.sql`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
  }
  // Creating an index on email for faster lookups
  await db.sql`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON ${tableName} (email)`
  // Creating an index on token for faster lookups
  await db.sql`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON ${tableName} (token)`

  console.log(`[DB:Create Password Reset Tokens ${connectorName} Table] ${tableName} table created successfully!`)
  console.log(`[DB:Create Password Reset Tokens ${connectorName} Table] Fields: id, email, token, created_at`)

  console.log(`[DB:Create Password Reset Tokens ${connectorName} Table] Migration completed successfully!`)
}

const migrateDefault = async () => {
  console.log('[Nuxt Users] Starting migration for password_reset_tokens table...', process.argv[1])

  const options = useRuntimeConfig().nuxtUsers

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
