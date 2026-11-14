import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import { runMigrations, getAppliedMigrations, markMigrationAsApplied, migrations } from '../../src/runtime/server/utils/migrate'
import type { DatabaseConfig, DatabaseType, ModuleOptions } from '../../src/types'
import { cleanupTestSetup, createTestSetup } from '../test-setup'
import { closeAllDbConnections, useDb } from '../../src/runtime/server/utils'
import { assertTableExists, columnExists, indexExists, tableExists } from '../../src/runtime/server/utils/schema'

interface RawSqlite {
  exec: (sql: string) => void
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('CLI: Migrate', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_migrate',
      }
    }
    if (dbType === 'mysql') {
      dbConfig = {
        host: process.env.DB_HOST,
        port: Number.parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      }
    }
    if (dbType === 'postgresql') {
      dbConfig = {
        host: process.env.DB_HOST,
        port: Number.parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      }
    }

    const settings = await createTestSetup({
      dbType,
      dbConfig,
    })

    db = settings.db
    testOptions = settings.testOptions

    // Clean up any leftover tables from previous tests
    // This ensures a fresh state even if previous tests didn't clean up properly
    if (dbType !== 'sqlite') {
      try {
        await db.sql`DROP TABLE IF EXISTS {${testOptions.tables.passwordResetTokens}}`
        await db.sql`DROP TABLE IF EXISTS {${testOptions.tables.personalAccessTokens}}`
        await db.sql`DROP TABLE IF EXISTS {${testOptions.tables.users}}`
        await db.sql`DROP TABLE IF EXISTS migrations`
      }
      catch {
        // Ignore errors - tables might not exist
      }
    }
  })

  afterEach(async () => {
    // Close all cached connections first to avoid stale connections
    await closeAllDbConnections()

    // Clean up all tables - order matters due to foreign keys
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.passwordResetTokens)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.personalAccessTokens)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], 'migrations')
  })

  it('should run all migrations successfully', async () => {
    await runMigrations(testOptions)

    // Verify migrations table exists
    const migrationsResult = await db.sql`SELECT 1 FROM migrations LIMIT 1`
    expect(migrationsResult).toBeDefined()

    // Verify all required tables exist
    const usersResult = await db.sql`SELECT 1 FROM {${testOptions.tables.users}} LIMIT 1`
    expect(usersResult).toBeDefined()

    const tokensResult = await db.sql`SELECT 1 FROM {${testOptions.tables.personalAccessTokens}} LIMIT 1`
    expect(tokensResult).toBeDefined()

    const resetTokensResult = await db.sql`SELECT 1 FROM {${testOptions.tables.passwordResetTokens}} LIMIT 1`
    expect(resetTokensResult).toBeDefined()
  })

  it('should track applied migrations correctly', async () => {
    await runMigrations(testOptions)

    const appliedMigrations = await getAppliedMigrations(testOptions)

    expect(appliedMigrations).toContain('create_migrations_table')
    expect(appliedMigrations).toContain('create_personal_access_tokens_table')
    expect(appliedMigrations).toContain('add_active_to_users')
    expect(appliedMigrations).toContain('add_google_oauth_fields')
    expect(appliedMigrations).toHaveLength(migrations.length)
  })

  it('should not run migrations twice', async () => {
    // Run migrations first time
    await runMigrations(testOptions)

    const firstRunMigrations = await getAppliedMigrations(testOptions)
    expect(firstRunMigrations).toHaveLength(migrations.length)

    // Run migrations second time
    await runMigrations(testOptions)

    const secondRunMigrations = await getAppliedMigrations(testOptions)
    expect(secondRunMigrations).toHaveLength(migrations.length)

    // Should be the same migrations
    expect(secondRunMigrations).toEqual(firstRunMigrations)
  })

  it('should mark migration as applied', async () => {
    // First create the migrations table
    await runMigrations(testOptions)

    const testMigrationName = 'test_migration'

    await markMigrationAsApplied(testOptions, testMigrationName)

    const appliedMigrations = await getAppliedMigrations(testOptions)
    expect(appliedMigrations).toContain(testMigrationName)
  })

  it('should handle getAppliedMigrations when migrations table does not exist', async () => {
    // Don't run migrations, so migrations table doesn't exist
    const appliedMigrations = await getAppliedMigrations(testOptions)
    expect(appliedMigrations).toEqual([])
  })

  it('should create all tables in correct order', async () => {
    await runMigrations(testOptions)

    // Check that all tables exist by trying to query them
    // Users table
    const usersResult = await db.sql`SELECT 1 FROM {${testOptions.tables.users}} LIMIT 1`
    expect(usersResult).toBeDefined()

    // Personal access tokens table
    const tokensResult = await db.sql`SELECT 1 FROM {${testOptions.tables.personalAccessTokens}} LIMIT 1`
    expect(tokensResult).toBeDefined()

    // Password reset tokens table
    const resetTokensResult = await db.sql`SELECT 1 FROM {${testOptions.tables.passwordResetTokens}} LIMIT 1`
    expect(resetTokensResult).toBeDefined()

    // Migrations table
    const migrationsResult = await db.sql`SELECT 1 FROM migrations LIMIT 1`
    expect(migrationsResult).toBeDefined()

    // Test that we can insert and query data to verify table structure
    // Test users table structure
    await db.sql`
      INSERT INTO {${testOptions.tables.users}} (email, name, password)
      VALUES ('test@example.com', 'Test User', 'hashedpassword')
    `
    const userResult = await db.sql`SELECT id, email, name, password, created_at, updated_at FROM {${testOptions.tables.users}} WHERE email = 'test@example.com'`
    const user = userResult.rows?.[0]
    expect(user).toBeDefined()
    expect(user?.id).toBe(1)
    expect(user?.email).toBe('test@example.com')
    expect(user?.name).toBe('Test User')
    expect(user?.password).toBe('hashedpassword')
    expect(user?.created_at).toBeDefined()
    expect(user?.updated_at).toBeDefined()

    // Test personal access tokens table structure
    await db.sql`
      INSERT INTO {${testOptions.tables.personalAccessTokens}} (tokenable_type, tokenable_id, name, token)
      VALUES ('App-Models-User', 1, 'test-token', 'test-token-value')
    `
    const tokenResult = await db.sql`SELECT id, tokenable_type, tokenable_id, name, token, created_at FROM {${testOptions.tables.personalAccessTokens}} WHERE token = 'test-token-value'`
    const token = tokenResult.rows?.[0]
    expect(token).toBeDefined()
    expect(token?.id).toBe(1)
    expect(token?.tokenable_type).toBe('App-Models-User')
    expect(token?.tokenable_id).toBe(1)
    expect(token?.name).toBe('test-token')
    expect(token?.token).toBe('test-token-value')
    expect(token?.created_at).toBeDefined()

    // Test password reset tokens table structure
    await db.sql`
      INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token)
      VALUES ('test@example.com', 'reset-token-value')
    `
    const resetTokenResult = await db.sql`SELECT id, email, token, created_at FROM {${testOptions.tables.passwordResetTokens}} WHERE token = 'reset-token-value'`
    const resetToken = resetTokenResult.rows?.[0]
    expect(resetToken).toBeDefined()
    expect(resetToken?.id).toBe(1)
    expect(resetToken?.email).toBe('test@example.com')
    expect(resetToken?.token).toBe('reset-token-value')
    expect(resetToken?.created_at).toBeDefined()

    // Test migrations table structure
    const migrationsResult2 = await db.sql`SELECT id, name, executed_at FROM migrations ORDER BY id`
    const fetchedMigrations = migrationsResult2.rows || []
    expect(fetchedMigrations).toHaveLength(migrations.length)
    expect(fetchedMigrations[0]?.name).toBe('create_migrations_table')
    expect(fetchedMigrations[1]?.name).toBe('create_users_table')
    expect(fetchedMigrations[2]?.name).toBe('create_personal_access_tokens_table')
    expect(fetchedMigrations[3]?.name).toBe('create_password_reset_tokens_table')
    expect(fetchedMigrations[4]?.name).toBe('add_active_to_users')
    expect(fetchedMigrations[5]?.name).toBe('add_google_oauth_fields')
  })

  it('should handle partial migrations correctly', async () => {
    // Manually create migrations table and mark some migrations as applied
    if (dbType === 'sqlite') {
      await db.sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    }
    if (dbType === 'mysql') {
      await db.sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    }
    if (dbType === 'postgresql') {
      await db.sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    }
    // Mark only the first migration as applied
    await db.sql`INSERT INTO migrations (name) VALUES ('create_migrations_table')`

    // Run migrations - should only run the remaining ones
    await runMigrations(testOptions)

    const appliedMigrations = await getAppliedMigrations(testOptions)
    expect(appliedMigrations).toContain('create_migrations_table')
    expect(appliedMigrations).toContain('create_users_table')
    expect(appliedMigrations).toContain('create_personal_access_tokens_table')
    expect(appliedMigrations).toContain('create_password_reset_tokens_table')
    expect(appliedMigrations).toContain('add_active_to_users')
    expect(appliedMigrations).toContain('add_google_oauth_fields')
    expect(appliedMigrations).toHaveLength(migrations.length)
  })
  describe('a migration is recorded only if its schema change is in place (#221)', () => {
    const extraMigrationName = 'test_extra_migration'

    afterEach(async () => {
      const index = migrations.findIndex(m => m.name === extraMigrationName)
      if (index !== -1) {
        migrations.splice(index, 1)
      }
      if (dbType !== 'sqlite') {
        await db.sql`DROP TABLE IF EXISTS test_extra_table`
      }
    })

    it('does not record a migration whose verification fails, and stops the run', async () => {
      migrations.push({
        name: extraMigrationName,
        run: async () => {},
        verify: options => assertTableExists(options, 'test_extra_table')
      })

      await expect(runMigrations(testOptions)).rejects.toThrow('test_extra_table')

      const applied = await getAppliedMigrations(testOptions)
      expect(applied).not.toContain(extraMigrationName)
      expect(applied).toHaveLength(migrations.length - 1)
    })

    it('runs a failed migration again on the next run', async () => {
      let attempts = 0
      migrations.push({
        name: extraMigrationName,
        run: async (options) => {
          attempts++
          if (attempts === 1) {
            throw new Error('database is locked')
          }
          const migrationDb = await useDb(options)
          await migrationDb.sql`CREATE TABLE IF NOT EXISTS test_extra_table (id INT)`
        },
        verify: options => assertTableExists(options, 'test_extra_table')
      })

      await expect(runMigrations(testOptions)).rejects.toThrow('database is locked')
      expect(await getAppliedMigrations(testOptions)).not.toContain(extraMigrationName)

      await expect(runMigrations(testOptions)).resolves.toEqual([extraMigrationName])
      expect(await getAppliedMigrations(testOptions)).toContain(extraMigrationName)
    })

    it('rolls back the DDL together with the record when the migration fails', async () => {
      // MySQL commits DDL implicitly, so only SQLite and PostgreSQL can roll it back
      if (dbType === 'mysql') {
        return
      }

      migrations.push({
        name: extraMigrationName,
        run: async (options) => {
          const migrationDb = await useDb(options)
          await migrationDb.sql`CREATE TABLE test_extra_table (id INT)`
        },
        verify: async () => {
          throw new Error('verification failed')
        }
      })

      await expect(runMigrations(testOptions)).rejects.toThrow('verification failed')

      expect(await tableExists(testOptions, 'test_extra_table')).toBe(false)
      expect(await getAppliedMigrations(testOptions)).not.toContain(extraMigrationName)
    })
  })

  it('creates every table, column and index the migrations verify', async () => {
    await runMigrations(testOptions)

    expect(await tableExists(testOptions, testOptions.tables.users)).toBe(true)
    expect(await columnExists(testOptions, testOptions.tables.users, 'active')).toBe(true)
    expect(await columnExists(testOptions, testOptions.tables.users, 'google_id')).toBe(true)
    expect(await columnExists(testOptions, testOptions.tables.users, 'no_such_column')).toBe(false)
    expect(await indexExists(testOptions, testOptions.tables.users, 'idx_users_active')).toBe(true)
    expect(await tableExists(testOptions, 'no_such_table')).toBe(false)
  })

  it('does not lose tables to a transaction the app opened on the shared connection (#221)', async () => {
    if (dbType !== 'sqlite') {
      return
    }

    // The app's own migration runner, using the same connection (useNuxtUsersDatabase), opens a
    // transaction and later rolls it back. nuxt-users must not run its DDL inside it.
    const shared = await useDb(testOptions)
    const raw = await shared.getInstance() as RawSqlite
    raw.exec('BEGIN')

    const run = runMigrations(testOptions)
    await sleep(100)
    raw.exec('ROLLBACK')
    await run

    expect(await tableExists(testOptions, testOptions.tables.users)).toBe(true)
    expect(await tableExists(testOptions, testOptions.tables.personalAccessTokens)).toBe(true)
    expect(await tableExists(testOptions, testOptions.tables.passwordResetTokens)).toBe(true)
    expect(await getAppliedMigrations(testOptions)).toHaveLength(migrations.length)
  })

  it('waits without blocking the event loop while another connection holds the write lock', async () => {
    if (dbType !== 'sqlite') {
      return
    }

    // `db` is a separate connection to the same file
    const other = await db.getInstance() as RawSqlite
    other.exec('BEGIN IMMEDIATE')
    // Released by a timer, which can only fire if runMigrations waits asynchronously
    setTimeout(() => other.exec('COMMIT'), 200)

    await runMigrations(testOptions)

    expect(await tableExists(testOptions, testOptions.tables.users)).toBe(true)
    expect(await getAppliedMigrations(testOptions)).toHaveLength(migrations.length)
  })
})
