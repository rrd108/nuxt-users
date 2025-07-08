import { usersTable as usersTableGetter, personalAccessTokensTable as personalAccessTokensTableGetter } from '../utils/db'
// We don't use useRuntimeConfig here as this is a Nitro plugin, not an event handler.
// The db initialization logic within `../utils/db` will use useRuntimeConfig.
// But for this, the module logic already decided if this plugin should run.

let migrationsRan = false

export default async function migrationsPlugin(_nitroApp: any) {
  if (migrationsRan) {
    return
  }

  console.log('[Nuxt Users] Running database migrations...')

  const users = usersTableGetter.get()
  const tokens = personalAccessTokensTableGetter.get()

  try {
    // Check if the 'users' table exists by trying to query it.
    // db0 with unstorage driver creates tables on first write/query if they don't exist.
    // This is a way to "touch" the table and ensure it's considered.
    await users.select({ id: 1 }).first().catch(() => {
      console.log('[Nuxt Users] Users table initialized or already exists.')
    })

    // Check if the 'personal_access_tokens' table exists
    await tokens.select({ id: 1 }).first().catch(() => {
      console.log('[Nuxt Users] Personal access tokens table initialized or already exists.')
    })

    // With db0 and key-value stores, explicit schema definition (CREATE TABLE) isn't
    // always done in the same way as SQL. The structure is often enforced by the application logic
    // and how data is inserted/queried.
    // For more complex needs (like SQL constraints, indexing), one would use db.sql`...`
    // if the underlying driver supports raw SQL and db0 exposes that.

    console.log('[Nuxt Users] Database tables checked/initialized.')
  }
  catch (error) {
    console.error('[Nuxt Users] Error during migrations:', error)
    // Depending on the error, you might want to prevent the app from starting
  }

  migrationsRan = true
  console.log('[Nuxt Users] Database migrations completed.')
}
