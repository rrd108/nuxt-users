import { useDb } from './db.ts'
import type { ModuleOptions } from '../../../types.ts'

export const addGoogleOauthFields = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const tableName = options.tables.users

  console.log(`[Nuxt Users] DB:Add Google OAuth fields to ${connectorName} Users Table in ${tableName}...`)

  if (connectorName === 'sqlite' || connectorName === 'mysql' || connectorName === 'postgresql') {
    // Try to add the columns, ignore errors if they already exist
    try {
      await db.sql`ALTER TABLE {${tableName}} ADD COLUMN google_id TEXT`
      console.log('[Nuxt Users] Added google_id column ✅')
    }
    catch (error) {
      // Column might already exist, ignore the error
      console.error('[Nuxt Users] google_id column might already exist', error)
    }

    try {
      await db.sql`ALTER TABLE {${tableName}} ADD COLUMN profile_picture TEXT`
      console.log('[Nuxt Users] Added profile_picture column ✅')
    }
    catch (error) {
      // Column might already exist, ignore the error
      console.error('[Nuxt Users] profile_picture column might already exist', error)
    }
  }

  console.log(`[Nuxt Users] DB:Add Google OAuth fields to ${connectorName} Users Table ✅`)
}
