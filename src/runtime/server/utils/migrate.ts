import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'
import { createUsersTable } from './create-users-table'
import { createPersonalAccessTokensTable } from './create-personal-access-tokens-table'
import { createPasswordResetTokensTable } from './create-password-reset-tokens-table'
import { createMigrationsTable } from './create-migrations-table'
import { addActiveToUsers } from './add-active-to-users'
import { addGoogleOauthFields } from './add-google-oauth-fields'
import { addActiveIndexToUsers, addTokenableIndexToPersonalAccessTokens } from './add-indexes'
import { assertColumnsExist, assertIndexExists, assertTableExists, tableExists } from './schema'

interface Migration {
  name: string
  run: (options: ModuleOptions) => Promise<void>
  /** Throws if the schema change the migration makes is not in place. Runs before the migration is recorded. */
  verify: (options: ModuleOptions) => Promise<void>
}

export const migrations: Migration[] = [
  {
    name: 'create_migrations_table',
    run: createMigrationsTable,
    verify: options => assertTableExists(options, options.tables.migrations)
  },
  {
    name: 'create_users_table',
    run: createUsersTable,
    verify: options => assertTableExists(options, options.tables.users)
  },
  {
    name: 'create_personal_access_tokens_table',
    run: createPersonalAccessTokensTable,
    verify: options => assertTableExists(options, options.tables.personalAccessTokens)
  },
  {
    name: 'create_password_reset_tokens_table',
    run: createPasswordResetTokensTable,
    verify: options => assertTableExists(options, options.tables.passwordResetTokens)
  },
  {
    name: 'add_active_to_users',
    run: addActiveToUsers,
    verify: options => assertColumnsExist(options, options.tables.users, ['active'])
  },
  {
    name: 'add_google_oauth_fields',
    run: addGoogleOauthFields,
    verify: options => assertColumnsExist(options, options.tables.users, ['google_id', 'profile_picture'])
  },
  {
    name: 'add_active_index_to_users',
    run: addActiveIndexToUsers,
    verify: options => assertIndexExists(options, options.tables.users, 'idx_users_active')
  },
  {
    name: 'add_tokenable_index_to_personal_access_tokens',
    run: addTokenableIndexToPersonalAccessTokens,
    verify: options => assertIndexExists(options, options.tables.personalAccessTokens, 'idx_personal_access_tokens_tokenable')
  }
]

// How long a migration waits for another connection's (or the app's own) transaction to finish
const LOCK_WAIT_MS = 30_000

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// The subset of the better-sqlite3 Database API used here (better-sqlite3 is an optional peer dependency)
interface RawSqlite {
  inTransaction: boolean
  exec: (sql: string) => void
  pragma: (source: string, options?: { simple?: boolean }) => unknown
}

const isSqliteBusy = (error: unknown) =>
  typeof (error as { code?: unknown })?.code === 'string' && (error as { code: string }).code.startsWith('SQLITE_BUSY')

/**
 * Starts a write transaction on SQLite without blocking the event loop.
 * better-sqlite3 waits for a lock synchronously (busy_timeout), which can never succeed when the lock
 * is held by another connection in the same process. So the busy timeout is switched off for the
 * BEGIN IMMEDIATE attempt, and the wait happens here with async delays instead.
 * BEGIN IMMEDIATE takes the write lock up front, so a lock conflict fails before any DDL runs.
 */
const beginSqliteTransaction = async (raw: RawSqlite, migrationName: string) => {
  const deadline = Date.now() + LOCK_WAIT_MS
  let delay = 25
  let warnedShared = false

  while (true) {
    if (raw.inTransaction) {
      // Another caller has a transaction open on this very connection (e.g. an app migration run
      // through useNuxtUsersDatabase()). Statements run now would become part of it.
      if (!warnedShared) {
        console.warn(`[Nuxt Users] Waiting to run migration ${migrationName}: a transaction is already open on the nuxt-users database connection. If your app runs its own migrations over this connection, run them after the nuxt-users:migrated hook.`)
        warnedShared = true
      }
    }
    else {
      const previousTimeout = raw.pragma('busy_timeout', { simple: true })
      raw.pragma('busy_timeout = 0')
      try {
        raw.exec('BEGIN IMMEDIATE')
        return
      }
      catch (error) {
        if (!isSqliteBusy(error)) {
          throw error
        }
      }
      finally {
        raw.pragma(`busy_timeout = ${Number(previousTimeout) || 0}`)
      }
    }

    if (Date.now() >= deadline) {
      throw new Error(`[Nuxt Users] Could not lock the database to run migration ${migrationName} within ${LOCK_WAIT_MS / 1000}s`)
    }
    await sleep(delay)
    delay = Math.min(delay * 2, 1000)
  }
}

/**
 * Runs `fn` so that its DDL and the migration record are committed together or not at all.
 * SQLite and PostgreSQL have transactional DDL. MySQL commits every DDL statement implicitly,
 * so there `fn` runs as is and the verify step is what keeps a failed migration from being recorded.
 */
const inMigrationTransaction = async <T>(options: ModuleOptions, migrationName: string, fn: () => Promise<T>): Promise<T> => {
  const db = await useDb(options)
  const connectorName = options.connector!.name

  if (connectorName === 'sqlite') {
    const raw = await db.getInstance() as RawSqlite
    await beginSqliteTransaction(raw, migrationName)
    try {
      const result = await fn()
      raw.exec('COMMIT')
      return result
    }
    catch (error) {
      if (raw.inTransaction) {
        raw.exec('ROLLBACK')
      }
      throw error
    }
  }

  if (connectorName === 'postgresql') {
    await db.exec('BEGIN')
    try {
      // Serialize concurrent migration runs (e.g. several app instances starting together)
      await db.sql`SELECT pg_advisory_xact_lock(hashtext(${`nuxt-users:${options.tables.migrations}`}))`
      const result = await fn()
      await db.exec('COMMIT')
      return result
    }
    catch (error) {
      await db.exec('ROLLBACK').catch(() => {})
      throw error
    }
  }

  return fn()
}

const isMigrationApplied = async (options: ModuleOptions, migrationName: string): Promise<boolean> => {
  const db = await useDb(options)
  const result = await db.sql`SELECT name FROM {${options.tables.migrations}} WHERE name = ${migrationName}` as { rows: unknown[] }
  return result.rows.length > 0
}

export const getAppliedMigrations = async (options: ModuleOptions): Promise<string[]> => {
  const db = await useDb(options)

  try {
    const result = await db.sql`SELECT name FROM {${options.tables.migrations}} ORDER BY id` as { rows: Array<{ name: string }> }
    return result.rows.map(row => row.name)
  }
  catch {
    // If migrations table doesn't exist, return empty array
    return []
  }
}

export const markMigrationAsApplied = async (options: ModuleOptions, migrationName: string): Promise<void> => {
  const db = await useDb(options)

  await db.sql`INSERT INTO {${options.tables.migrations}} (name) VALUES (${migrationName})`
}

/**
 * Runs the pending migrations in order. Each migration's DDL, its verification and its record in the
 * migrations table form one unit: a migration is recorded only if its schema change is in place.
 * Throws on the first failure; the failed migration and the ones after it run again next time.
 * Returns the names of the migrations applied by this run.
 */
export const runMigrations = async (options: ModuleOptions): Promise<string[]> => {
  console.log('[Nuxt Users] Starting migration system...')

  // First, ensure migrations table exists (through the lock-aware transaction, as it is a write)
  if (!await tableExists(options, options.tables.migrations)) {
    await inMigrationTransaction(options, 'create_migrations_table', () => createMigrationsTable(options))
  }

  const appliedMigrations = await getAppliedMigrations(options)
  console.log(`[Nuxt Users] Applied migrations: ${appliedMigrations.join(', ')}`)

  const pendingMigrations = migrations.filter(migration => !appliedMigrations.includes(migration.name))

  if (pendingMigrations.length === 0) {
    console.log('[Nuxt Users] No pending migrations to run.')
    return []
  }

  console.log(`[Nuxt Users] Found ${pendingMigrations.length} pending migrations:`)
  pendingMigrations.forEach((migration) => {
    console.log(`[Nuxt Users]   - ${migration.name}`)
  })

  const appliedNow: string[] = []

  for (const migration of pendingMigrations) {
    console.log(`[Nuxt Users] Running migration: ${migration.name}`)

    try {
      const applied = await inMigrationTransaction(options, migration.name, async () => {
        // Recreate it if a rolled-back outer transaction took it away
        if (!await tableExists(options, options.tables.migrations)) {
          await createMigrationsTable(options)
        }
        // Another process may have applied it since the pending list was read
        if (await isMigrationApplied(options, migration.name)) {
          return false
        }
        await migration.run(options)
        await migration.verify(options)
        await markMigrationAsApplied(options, migration.name)
        return true
      })

      if (applied) {
        appliedNow.push(migration.name)
        console.log(`[Nuxt Users] ✓ Migration ${migration.name} successfull ✅`)
      }
      else {
        console.log(`[Nuxt Users] Migration ${migration.name} was already applied by another process, skipping`)
      }
    }
    catch (error) {
      console.error(`[Nuxt Users] ✗ Migration ${migration.name} failed:`, error)
      throw error
    }
  }

  console.log('[Nuxt Users] All migrations successfull ✅')
  return appliedNow
}
