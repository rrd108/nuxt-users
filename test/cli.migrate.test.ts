import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import { runMigrations, getAppliedMigrations, markMigrationAsApplied } from '../src/utils/migrate'
import type { DatabaseConfig, DatabaseType, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './test-setup'

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
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], 'migrations')
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.personalAccessTokens)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.passwordResetTokens)
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
    const migrations = migrationsResult2.rows || []
    expect(migrations).toHaveLength(4)
    expect(migrations[0].name).toBe('create_migrations_table')
    expect(migrations[1].name).toBe('create_users_table')
    expect(migrations[2].name).toBe('create_personal_access_tokens_table')
    expect(migrations[3].name).toBe('create_password_reset_tokens_table')
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
    expect(appliedMigrations).toHaveLength(4)
  })
})
