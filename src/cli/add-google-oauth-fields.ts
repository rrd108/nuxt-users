import { defineCommand } from 'citty'
import { useDb } from '../runtime/server/utils'
import { loadOptions } from './utils'

export default defineCommand({
  meta: {
    name: 'add-google-oauth-fields',
    description: 'Add Google OAuth fields (google_id, profile_picture) to existing users table'
  },
  async run() {
    console.log('[Nuxt Users] Adding Google OAuth fields to users table...')

    const options = await loadOptions()
    const connectorName = options.connector!.name
    const db = await useDb(options)
    const tableName = options.tables.users

    console.log(`[Nuxt Users] DB:Migrate ${connectorName} Users Table Adding Google OAuth fields...`)

    try {
      if (connectorName === 'sqlite') {
        // Check if columns already exist
        const tableInfo = await db.sql`PRAGMA table_info(${tableName})` as { rows: Array<{ name: string }> }
        const columnNames = tableInfo.rows.map(row => row.name)

        if (!columnNames.includes('google_id')) {
          await db.sql`ALTER TABLE {${tableName}} ADD COLUMN google_id TEXT`
          console.log('[Nuxt Users] Added google_id column to SQLite users table ✅')
        }

        if (!columnNames.includes('profile_picture')) {
          await db.sql`ALTER TABLE {${tableName}} ADD COLUMN profile_picture TEXT`
          console.log('[Nuxt Users] Added profile_picture column to SQLite users table ✅')
        }

        if (!columnNames.includes('last_login_at')) {
          await db.sql`ALTER TABLE {${tableName}} ADD COLUMN last_login_at DATETIME`
          console.log('[Nuxt Users] Added last_login_at column to SQLite users table ✅')
        }
      }

      if (connectorName === 'mysql') {
        // Check if columns exist
        const checkColumns = await db.sql`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ${tableName}
          AND COLUMN_NAME IN ('google_id', 'profile_picture')
        ` as { rows: Array<{ COLUMN_NAME: string }> }

        const existingColumns = checkColumns.rows.map(row => row.COLUMN_NAME)

        if (!existingColumns.includes('google_id')) {
          await db.sql`ALTER TABLE {${tableName}} ADD COLUMN google_id VARCHAR(255) UNIQUE`
          console.log('[Nuxt Users] Added google_id column to MySQL users table ✅')
        }

        if (!existingColumns.includes('profile_picture')) {
          await db.sql`ALTER TABLE {${tableName}} ADD COLUMN profile_picture TEXT`
          console.log('[Nuxt Users] Added profile_picture column to MySQL users table ✅')
        }
      }

      if (connectorName === 'postgresql') {
        // Check if columns exist
        const checkColumns = await db.sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = ${tableName}
          AND column_name IN ('google_id', 'profile_picture')
        ` as { rows: Array<{ column_name: string }> }

        const existingColumns = checkColumns.rows.map(row => row.column_name)

        if (!existingColumns.includes('google_id')) {
          await db.sql`ALTER TABLE {${tableName}} ADD COLUMN google_id VARCHAR(255) UNIQUE`
          console.log('[Nuxt Users] Added google_id column to PostgreSQL users table ✅')
        }

        if (!existingColumns.includes('profile_picture')) {
          await db.sql`ALTER TABLE {${tableName}} ADD COLUMN profile_picture TEXT`
          console.log('[Nuxt Users] Added profile_picture column to PostgreSQL users table ✅')
        }
      }

      console.log('[Nuxt Users] Google OAuth fields migration completed successfully! ✅')
    }
    catch (error) {
      console.error('[Nuxt Users] DB:Migration Error:', error)
      process.exit(1)
    }
  }
})
