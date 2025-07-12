import { createDatabase } from 'db0'
import { getConnector } from './db'
import type { ModuleOptions } from '../../../types'

export const createMigrationsTable = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))

  const tableName = 'migrations'

  console.log(`[DB:Create Migrations ${connectorName} Table] Creating ${tableName} table with ${connectorName} connector...`)

  if (connectorName === 'sqlite') {
    await db.sql`
    CREATE TABLE IF NOT EXISTS {${tableName}} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
  }
  if (connectorName === 'mysql') {
    await db.sql`
      CREATE TABLE IF NOT EXISTS {${tableName}} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
  }

  console.log(`[DB:Create Migrations ${connectorName} Table] Migration completed successfully!`)
}

const migrateDefault = async () => {
  console.log('[Nuxt Users] Starting migration for migrations table...')

  const options = useRuntimeConfig().nuxtUsers

  try {
    await createMigrationsTable(options)
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
