import { createDatabase } from 'db0'
import { getConnector } from './db'
import type { ModuleOptions } from '../../../types'

export const createUsersTable = async (table: string, options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))

  console.log(`[DB:Create Users Table] Creating ${table} table with ${connectorName} connector...`)

  if (table === 'users') {
    // Create users table with the specified fields
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
    console.log('[DB:Create Users Table] Users table created successfully!')
    console.log('[DB:Create Users Table] Fields: id, email, name, password, created_at, updated_at')
  } else {
    console.log(`[DB:Create Users Table] Unknown table: ${table}`)
    throw new Error(`Unknown table: ${table}`)
  }

  console.log('[DB:Create Users Table] Migration completed successfully!')
}

// Default options - you can override these with environment variables
const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/db.sqlite3',
    },
  },
}

const migrateDefault = async () => {
  console.log('[Nuxt Users] Starting migration...')

  try {
    await createUsersTable('users', defaultOptions)
    process.exit(0)
  } catch (error) {
    console.error('[DB:Create Users Table] Error:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (process.argv[1] && process.argv[1].endsWith('create-users-table.ts')) {
  migrateDefault()
} 