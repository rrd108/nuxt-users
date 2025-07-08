import { defineEventHandler } from 'h3'
import { usersTable, personalAccessTokensTable } from './index'
import { useRuntimeConfig } from '#imports'

let migrationsRan = false

export default defineEventHandler(async () => {
  const { nuxtUsers } = useRuntimeConfig()

  if (!nuxtUsers.runMigrations || migrationsRan) {
    return
  }

  console.log('Running nuxt-users migrations...')

  // Define table schemas and create them if they don't exist
  // For db0, table creation is typically handled by the first operation if it doesn't exist
  // or by explicit schema definition if the driver supports it.
  // With unstorage fs driver, db0 creates tables on first write if not present.
  // However, it's good practice to "touch" them or ensure schema.

  // For users table: id, email, password, created_at, updated_at
  // We can ensure the table exists by trying to get an item or inserting a dummy one if needed,
  // but db0 with unstorage will handle it.
  // We might want to add indexing support later if db0 supports it directly or via driver options.

  // Example of ensuring tables (though db0 handles this implicitly with some drivers):
  try {
    await usersTable.select().first().catch(() => {}) // Try a select to ensure interaction
    await personalAccessTokensTable.select().first().catch(() => {}) // Try a select
    console.log('User and Token tables checked/initialized.')
  }
  catch (error) {
    console.error('Error initializing tables:', error)
  }

  // In a real scenario with more complex schemas or SQL databases,
  // you would run actual DDL statements here.
  // e.g., await db.sql`CREATE TABLE IF NOT EXISTS users (...)`
  // db0's current API is more key-value focused but aims for SQL-like operations.

  migrationsRan = true
  console.log('nuxt-users migrations completed.')
})
