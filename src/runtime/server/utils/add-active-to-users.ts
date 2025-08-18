import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'

export const addActiveToUsers = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const tableName = options.tables.users

  console.log(`[Nuxt Users] DB:Add active to ${connectorName} Users Table in ${tableName}...`)

  if (connectorName === 'sqlite' || connectorName === 'mysql' || connectorName === 'postgresql') {
    // Check if the active column already exists
    try {
      const result = await db.sql`PRAGMA table_info({${tableName}})` as { rows: Array<{ name: string }> }
      const hasActiveColumn = result.rows.some(row => row.name === 'active')

      if (!hasActiveColumn) {
        await db.sql`ALTER TABLE {${tableName}} ADD COLUMN active BOOLEAN DEFAULT TRUE`
      }
    }
    catch {
      // For MySQL and PostgreSQL, we'll try a different approach
      try {
        await db.sql`ALTER TABLE {${tableName}} ADD COLUMN active BOOLEAN DEFAULT TRUE`
      }
      catch (alterError) {
        // Column might already exist, ignore the error
        console.log(`[Nuxt Users] Active column might already exist: ${alterError}`)
      }
    }
  }

  console.log(`[Nuxt Users] DB:Add active to ${connectorName} Users Table ✅`)
}
