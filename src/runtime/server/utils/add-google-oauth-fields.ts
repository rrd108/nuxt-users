import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'
import { columnExists } from './schema'

export const addGoogleOauthFields = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const tableName = options.tables.users

  console.log(`[Nuxt Users] DB:Add Google OAuth fields to ${connectorName} Users Table in ${tableName}...`)

  // Newer users tables are created with these columns; only add what is missing, and let real errors propagate
  if (await columnExists(options, tableName, 'google_id')) {
    console.log('[Nuxt Users] google_id column already exists')
  }
  else {
    await db.sql`ALTER TABLE {${tableName}} ADD COLUMN google_id TEXT`
    console.log('[Nuxt Users] Added google_id column ✅')
  }

  if (await columnExists(options, tableName, 'profile_picture')) {
    console.log('[Nuxt Users] profile_picture column already exists')
  }
  else {
    await db.sql`ALTER TABLE {${tableName}} ADD COLUMN profile_picture TEXT`
    console.log('[Nuxt Users] Added profile_picture column ✅')
  }

  console.log(`[Nuxt Users] DB:Add Google OAuth fields to ${connectorName} Users Table ✅`)
}
