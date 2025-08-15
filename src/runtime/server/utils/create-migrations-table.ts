import { useDb } from './db'
import type { ModuleOptions } from '#nuxt-users/types'

export const createMigrationsTable = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const tableName = 'migrations'

  console.log(`[Nuxt Users] DB:Create Migrations ${connectorName} Table Creating ${tableName} table with ${connectorName} connector...`)

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
  if (connectorName === 'postgresql') {
    await db.sql`
      CREATE TABLE IF NOT EXISTS {${tableName}} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  }

  console.log(`[Nuxt Users] DB:Create Migrations ${connectorName} Table successfull ✅`)
}
