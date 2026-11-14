import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'
import { columnExists } from './schema'

export const addActiveToUsers = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const tableName = options.tables.users

  console.log(`[Nuxt Users] DB:Add active to ${connectorName} Users Table in ${tableName}...`)

  if (await columnExists(options, tableName, 'active')) {
    console.log('[Nuxt Users] active column already exists')
  }
  else {
    await db.sql`ALTER TABLE {${tableName}} ADD COLUMN active BOOLEAN DEFAULT TRUE`
  }

  console.log(`[Nuxt Users] DB:Add active to ${connectorName} Users Table ✅`)
}
