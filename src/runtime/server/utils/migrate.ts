import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'
import { createUsersTable } from './create-users-table'
import { createPersonalAccessTokensTable } from './create-personal-access-tokens-table'
import { createPasswordResetTokensTable } from './create-password-reset-tokens-table'
import { createMigrationsTable } from './create-migrations-table'
import { addActiveToUsers } from './add-active-to-users'
import { addGoogleOauthFields } from './add-google-oauth-fields'

interface Migration {
  name: string
  run: (options: ModuleOptions) => Promise<void>
}

const migrations: Migration[] = [
  {
    name: 'create_migrations_table',
    run: createMigrationsTable
  },
  {
    name: 'create_users_table',
    run: createUsersTable
  },
  {
    name: 'create_personal_access_tokens_table',
    run: createPersonalAccessTokensTable
  },
  {
    name: 'create_password_reset_tokens_table',
    run: createPasswordResetTokensTable
  },
  {
    name: 'add_active_to_users',
    run: addActiveToUsers
  },
  {
    name: 'add_google_oauth_fields',
    run: addGoogleOauthFields
  }
]

export const getAppliedMigrations = async (options: ModuleOptions): Promise<string[]> => {
  const db = await useDb(options)

  try {
    const result = await db.sql`SELECT name FROM migrations ORDER BY id` as { rows: Array<{ name: string }> }
    return result.rows.map(row => row.name)
  }
  catch {
    // If migrations table doesn't exist, return empty array
    return []
  }
}

export const markMigrationAsApplied = async (options: ModuleOptions, migrationName: string): Promise<void> => {
  const db = await useDb(options)

  await db.sql`INSERT INTO migrations (name) VALUES (${migrationName})`
}

export const runMigrations = async (options: ModuleOptions): Promise<void> => {
  console.log('[Nuxt Users] Starting migration system...')

  // First, ensure migrations table exists
  await createMigrationsTable(options)

  const appliedMigrations = await getAppliedMigrations(options)
  console.log(`[Nuxt Users] Applied migrations: ${appliedMigrations.join(', ')}`)

  const pendingMigrations = migrations.filter(migration => !appliedMigrations.includes(migration.name))

  if (pendingMigrations.length === 0) {
    console.log('[Nuxt Users] No pending migrations to run.')
    return
  }

  console.log(`[Nuxt Users] Found ${pendingMigrations.length} pending migrations:`)
  pendingMigrations.forEach((migration) => {
    console.log(`[Nuxt Users]   - ${migration.name}`)
  })

  for (const migration of pendingMigrations) {
    console.log(`[Nuxt Users] Running migration: ${migration.name}`)

    try {
      await migration.run(options)
      await markMigrationAsApplied(options, migration.name)
      console.log(`[Nuxt Users] ✓ Migration ${migration.name} successfull ✅`)
    }
    catch (error) {
      console.error(`[Nuxt Users] ✗ Migration ${migration.name} failed:`, error)
      throw error
    }
  }

  console.log('[Nuxt Users] All migrations successfull ✅')
}
