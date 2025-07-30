import { useDb } from './db'
import type { ModuleOptions } from '../types'

export const createPersonalAccessTokensTable = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const tableName = options.tables.personalAccessTokens

  console.log(`[Nuxt Users] DB:Create Personal Access Tokens ${connectorName} Table Creating ${tableName} table with ${connectorName} connector...`)

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
  if (connectorName === 'postgresql') {
    await db.sql`
    CREATE TABLE IF NOT EXISTS {${tableName}} (
      id SERIAL PRIMARY KEY,
      tokenable_type VARCHAR(255) NOT NULL,
      tokenable_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      abilities TEXT,
      last_used_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `
  }
  console.log(`[Nuxt Users] DB:Create Personal Access Tokens ${connectorName} Table Fields: id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at ✅`)
}
