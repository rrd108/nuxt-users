import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import { createMigrationsTable } from '../src/runtime/server/utils/create-migrations-table'
import type { DatabaseConfig, DatabaseType, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './test-setup'

describe('CLI: Create Migrations Table', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_create-migrations-table',
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
  })

  it('should create migrations table successfully', async () => {
    await createMigrationsTable(testOptions)

    // Verify table exists by querying it
    const result = await db.sql`SELECT 1 FROM migrations LIMIT 1`
    expect(result).toBeDefined()
  })

  it('should create table with correct schema', async () => {
    await createMigrationsTable(testOptions)

    // Test that we can insert and query data (this validates the schema works)
    await db.sql`
      INSERT INTO migrations (name)
      VALUES ('test_migration')
    `

    const result = await db.sql`SELECT id, name, executed_at FROM migrations WHERE name = 'test_migration'`
    const migration = result.rows?.[0]

    // Check all required fields exist and have correct types
    expect(migration).toBeDefined()
    expect(migration?.id).toBe(1) // Auto-increment works
    expect(migration?.name).toBe('test_migration')
    expect(migration?.executed_at).toBeDefined()

    // Test that name is unique
    await expect(db.sql`
      INSERT INTO migrations (name)
      VALUES ('test_migration')
    `).rejects.toThrow()
  })

  it('should handle CREATE TABLE IF NOT EXISTS correctly', async () => {
    // Create table first time
    await createMigrationsTable(testOptions)

    // Try to create table again (should not fail)
    await expect(createMigrationsTable(testOptions)).resolves.not.toThrow()

    // Verify table still exists and works
    const result = await db.sql`SELECT COUNT(*) as count FROM migrations`
    expect(result.rows?.[0]?.count).toBe(0)
  })

  it('should enforce unique constraint on name', async () => {
    await createMigrationsTable(testOptions)

    // Insert first migration
    await db.sql`
      INSERT INTO migrations (name, executed_at)
      VALUES ('test_migration', CURRENT_TIMESTAMP)
    `

    // Try to insert migration with same name (should fail)
    await expect(db.sql`
      INSERT INTO migrations (name, executed_at)
      VALUES ('test_migration', CURRENT_TIMESTAMP)
    `).rejects.toThrow()
  })

  it('should auto-increment ID correctly', async () => {
    await createMigrationsTable(testOptions)

    // Insert multiple migrations
    await db.sql`
      INSERT INTO migrations (name, executed_at)
      VALUES ('migration_1', CURRENT_TIMESTAMP)
    `
    await db.sql`
      INSERT INTO migrations (name, executed_at)
      VALUES ('migration_2', CURRENT_TIMESTAMP)
    `

    // Check IDs are auto-incremented
    const result = await db.sql`SELECT id, name FROM migrations ORDER BY id`
    const migrations = result.rows || []

    expect(migrations).toHaveLength(2)
    expect(migrations[0].id).toBe(1)
    expect(migrations[1].id).toBe(2)
  })

  it('should set default timestamp', async () => {
    await createMigrationsTable(testOptions)

    // Insert migration without specifying timestamp
    await db.sql`
      INSERT INTO migrations (name)
      VALUES ('test_migration')
    `

    // Check that timestamp was set
    const result = await db.sql`SELECT executed_at FROM migrations WHERE name = 'test_migration'`
    const migration = result.rows?.[0]

    expect(migration?.executed_at).toBeDefined()
    expect(migration?.executed_at).not.toBeNull()
  })

  it('should handle table creation with all constraints', async () => {
    await createMigrationsTable(testOptions)

    // Test inserting a valid migration
    await expect(db.sql`
      INSERT INTO migrations (name)
      VALUES ('valid_migration')
    `).resolves.not.toThrow()

    // Test that required fields are enforced
    await expect(db.sql`
      INSERT INTO migrations (executed_at)
      VALUES (CURRENT_TIMESTAMP)
    `).rejects.toThrow() // Missing name
  })

  it('should work with different migration names', async () => {
    await createMigrationsTable(testOptions)

    // Insert migrations with different names
    const migrationNames = [
      'create_users_table',
      'create_personal_access_tokens_table',
      'create_password_reset_tokens_table',
      'add_user_roles_table'
    ]

    for (const name of migrationNames) {
      await db.sql`
        INSERT INTO migrations (name)
        VALUES (${name})
      `
    }

    // Verify all migrations were inserted
    const result = await db.sql`SELECT name FROM migrations ORDER BY name`
    const insertedNames = result.rows?.map(row => row.name) || []

    expect(insertedNames).toHaveLength(4)
    expect(insertedNames).toContain('create_users_table')
    expect(insertedNames).toContain('create_personal_access_tokens_table')
    expect(insertedNames).toContain('create_password_reset_tokens_table')
    expect(insertedNames).toContain('add_user_roles_table')
  })
})
