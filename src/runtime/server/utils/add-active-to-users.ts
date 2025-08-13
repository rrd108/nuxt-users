import { useDb } from './db'
import type { ModuleOptions } from '../../../types'

export const addActiveToUsers = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const tableName = options.tables.users

  console.log(`[Nuxt Users] DB:Add active to ${connectorName} Users Table in ${tableName}...`)

  if (connectorName === 'sqlite') {
    await db.sql`ALTER TABLE {${tableName}} ADD COLUMN active BOOLEAN DEFAULT TRUE`
  }
  if (connectorName === 'mysql') {
    await db.sql`ALTER TABLE {${tableName}} ADD COLUMN active BOOLEAN DEFAULT TRUE`
  }
  if (connectorName === 'postgresql') {
    await db.sql`ALTER TABLE {${tableName}} ADD COLUMN active BOOLEAN DEFAULT TRUE`
  }

  console.log(`[Nuxt Users] DB:Add active to ${connectorName} Users Table ✅`)
}
