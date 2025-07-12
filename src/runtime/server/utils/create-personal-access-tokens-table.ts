import { createDatabase } from 'db0'
import { getConnector } from './db'
import type { ModuleOptions } from '../../../types'

export const createPersonalAccessTokensTable = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))
  const tableName = options.tables.personalAccessTokens

  console.log(`[DB:Create Personal Access Tokens ${connectorName} Table] Creating ${tableName} table with ${connectorName} connector...`)

  // Create personal_access_tokens table with the specified fields
  if (connectorName === 'sqlite') {
    await db.sql`
    CREATE TABLE IF NOT EXISTS {${tableName}} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tokenable_type TEXT NOT NULL,
      tokenable_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      abilities TEXT,
      last_used_at DATETIME,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
  }
  if (connectorName === 'mysql') {
    await db.sql`
    CREATE TABLE IF NOT EXISTS {${tableName}} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tokenable_type VARCHAR(255) NOT NULL,
      tokenable_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      abilities TEXT,
      last_used_at DATETIME,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `
  }
  console.log(`[DB:Create Personal Access Tokens ${connectorName} Table] Personal access tokens table created successfully!`)
  console.log(`[DB:Create Personal Access Tokens ${connectorName} Table] Fields: id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at`)

  console.log(`[DB:Create Personal Access Tokens ${connectorName} Table] Migration completed successfully!`)
}

const migrateDefault = async () => {
  console.log('[Nuxt Users] Starting migration for personal_access_tokens table...')
  const options = useRuntimeConfig().nuxtUsers

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
