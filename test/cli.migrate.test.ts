import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import { runMigrations, getAppliedMigrations, markMigrationAsApplied } from '../src/runtime/server/utils/migrate'
import type { DatabaseConfig, DatabaseType, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './utils/test-setup'

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
    const settings = await createTestSetup({
      dbType,
      dbConfig,
    })

    db = settings.db
    testOptions = settings.testOptions
  })

  afterEach(async () => {
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
    expect(appliedMigrations).toContain('create_users_table')
    expect(appliedMigrations).toContain('create_personal_access_tokens_table')
    expect(appliedMigrations).toContain('create_password_reset_tokens_table')
    expect(appliedMigrations).toHaveLength(4)
  })

  it('should not run migrations twice', async () => {
    // Run migrations first time
    await runMigrations(testOptions)

    const firstRunMigrations = await getAppliedMigrations(testOptions)
    expect(firstRunMigrations).toHaveLength(4)

    // Run migrations second time
    await runMigrations(testOptions)

    const secondRunMigrations = await getAppliedMigrations(testOptions)
    expect(secondRunMigrations).toHaveLength(4)

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

  it.only('should create all tables in correct order', async () => {
    await runMigrations(testOptions)

    // Check that all tables exist and have the correct structure
    // Users table
    const usersColumns = await db.sql`PRAGMA table_info({${testOptions.tables.users}})`
    const userColumnNames = usersColumns.rows?.map(row => row.name) || []
    expect(userColumnNames).toContain('id')
    expect(userColumnNames).toContain('email')
    expect(userColumnNames).toContain('name')
    expect(userColumnNames).toContain('password')
    expect(userColumnNames).toContain('created_at')
    expect(userColumnNames).toContain('updated_at')

    // Personal access tokens table
    const tokensColumns = await db.sql`PRAGMA table_info({${testOptions.tables.personalAccessTokens}})`
    const tokenColumnNames = tokensColumns.rows?.map(row => row.name) || []
    expect(tokenColumnNames).toContain('id')
    expect(tokenColumnNames).toContain('user_id')
    expect(tokenColumnNames).toContain('token')
    expect(tokenColumnNames).toContain('created_at')

    // Password reset tokens table
    const resetTokensColumns = await db.sql`PRAGMA table_info({${testOptions.tables.passwordResetTokens}})`
    const resetTokenColumnNames = resetTokensColumns.rows?.map(row => row.name) || []
    expect(resetTokenColumnNames).toContain('id')
    expect(resetTokenColumnNames).toContain('email')
    expect(resetTokenColumnNames).toContain('token')
    expect(resetTokenColumnNames).toContain('created_at')

    // Migrations table
    const migrationsColumns = await db.sql`PRAGMA table_info(migrations)`
    const migrationColumnNames = migrationsColumns.rows?.map(row => row.name) || []
    expect(migrationColumnNames).toContain('id')
    expect(migrationColumnNames).toContain('name')
    expect(migrationColumnNames).toContain('executed_at')
  })

  it('should handle partial migrations correctly', async () => {
    // Manually create migrations table and mark some migrations as applied
    await db.sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Mark only the first migration as applied
    await db.sql`INSERT INTO migrations (name) VALUES ('create_migrations_table')`

    // Run migrations - should only run the remaining ones
    await runMigrations(testOptions)

    const appliedMigrations = await getAppliedMigrations(testOptions)
    expect(appliedMigrations).toContain('create_migrations_table')
    expect(appliedMigrations).toContain('create_users_table')
    expect(appliedMigrations).toContain('create_personal_access_tokens_table')
    expect(appliedMigrations).toContain('create_password_reset_tokens_table')
    expect(appliedMigrations).toHaveLength(4)
  })
})
