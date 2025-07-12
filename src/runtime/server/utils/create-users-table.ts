import { createDatabase } from 'db0'
import { getConnector } from './db'
import type { ModuleOptions } from '../../../types'

export const createUsersTable = async (table: string, options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))

  console.log(`[DB:Create ${connectorName} Users Table] Creating ${table}...`)

  if (table === 'users') {
    if (connectorName === 'sqlite') {
      await db.sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    }
    if (connectorName === 'mysql') {
      await db.sql`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    }

    console.log(`[DB:Create ${connectorName} Users Table] Users table created successfully!`)
    console.log(`[DB:Create ${connectorName} Users Table] Fields: id, email, name, password, created_at, updated_at`)
  }
  else {
    console.log(`[DB:Create ${connectorName} Users Table] Unknown table: ${table}`)
    throw new Error(`Unknown table: ${table}`)
  }

  console.log(`[DB:Create ${connectorName} Users Table] Migration completed successfully!`)
}

const migrateDefault = async () => {
  console.log('[Nuxt Users] Starting migration...')

  const options = useRuntimeConfig().nuxtUsers

  try {
    await createUsersTable('users', options)
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
