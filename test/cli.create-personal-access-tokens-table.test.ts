import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import { createPersonalAccessTokensTable } from '../src/runtime/server/utils/create-personal-access-tokens-table'
import type { DatabaseConfig, DatabaseType, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './utils/test-setup'

describe('CLI: Create Personal Access Tokens Table', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_create-personal-access-tokens-table',
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
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.personalAccessTokens)
  })

  it('should create personal_access_tokens table successfully', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Verify table exists by querying it
    const result = await db.sql`SELECT 1 FROM ${testOptions.tables.personalAccessTokens} LIMIT 1`
    expect(result).toBeDefined()
  })

  it('should create table with correct schema', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Test that we can insert and query data (this validates the schema works)
    await db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token)
      VALUES ('App-Models-User', 1, 'Test Token', 'test-token-123')
    `

    const result = await db.sql`SELECT id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at FROM ${testOptions.tables.personalAccessTokens} WHERE token = 'test-token-123'`
    const token = result.rows?.[0]

    // Check all required fields exist and have correct types
    expect(token).toBeDefined()
    expect(token?.id).toBe(1) // Auto-increment works
    expect(token?.tokenable_type).toBe('App-Models-User')
    expect(token?.tokenable_id).toBe(1)
    expect(token?.name).toBe('Test Token')
    expect(token?.token).toBe('test-token-123')
    expect(token?.abilities).toBeNull() // Optional field
    expect(token?.last_used_at).toBeNull() // Optional field
    expect(token?.expires_at).toBeNull() // Optional field
    expect(token?.created_at).toBeDefined()
    expect(token?.updated_at).toBeDefined()

    // Test that token is unique
    await expect(db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token)
      VALUES ('App-Models-User', 2, 'Another Token', 'test-token-123')
    `).rejects.toThrow()
  })

  it('should handle CREATE TABLE IF NOT EXISTS correctly', async () => {
    // Create table first time
    await createPersonalAccessTokensTable(testOptions)

    // Try to create table again (should not fail)
    await expect(createPersonalAccessTokensTable(testOptions)).resolves.not.toThrow()

    // Verify table still exists and works
    const result = await db.sql`SELECT COUNT(*) as count FROM ${testOptions.tables.personalAccessTokens}`
    expect(result.rows?.[0]?.count).toBe(0)
  })

  it('should enforce unique constraint on token', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Insert first token
    await db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token, created_at, updated_at)
      VALUES ('App-Models-User', 1, 'First Token', 'unique-token-123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    // Try to insert token with same value (should fail)
    await expect(db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token, created_at, updated_at)
      VALUES ('App-Models-User', 2, 'Second Token', 'unique-token-123', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).rejects.toThrow()
  })

  it('should auto-increment ID correctly', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Insert multiple tokens
    await db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token, created_at, updated_at)
      VALUES ('App-Models-User', 1, 'Token 1', 'token-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    await db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token, created_at, updated_at)
      VALUES ('App-Models-User', 1, 'Token 2', 'token-2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    // Check IDs are auto-incremented
    const result = await db.sql`SELECT id, name, token FROM ${testOptions.tables.personalAccessTokens} ORDER BY id`
    const tokens = result.rows || []

    expect(tokens).toHaveLength(2)
    expect(tokens[0].id).toBe(1)
    expect(tokens[1].id).toBe(2)
  })

  it('should set default timestamps', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Insert token without specifying timestamps
    await db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token)
      VALUES ('App-Models-User', 1, 'Test Token', 'test-token')
    `

    // Check that timestamps were set
    const result = await db.sql`SELECT created_at, updated_at FROM ${testOptions.tables.personalAccessTokens} WHERE token = 'test-token'`
    const token = result.rows?.[0]

    expect(token).toBeDefined()
    expect(token?.created_at).toBeDefined()
    expect(token?.updated_at).toBeDefined()
    expect(token?.created_at).not.toBeNull()
    expect(token?.updated_at).not.toBeNull()
  })

  it('should handle optional fields correctly', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Insert token with all optional fields
    await db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at)
      VALUES ('App-Models-User', 1, 'Full Token', 'full-token', '["read", "write"]', CURRENT_TIMESTAMP, '2024-12-31 23:59:59')
    `

    const result = await db.sql`SELECT abilities, last_used_at, expires_at FROM ${testOptions.tables.personalAccessTokens} WHERE token = 'full-token'`
    const token = result.rows?.[0]

    expect(token?.abilities).toBe('["read", "write"]')
    expect(token?.last_used_at).toBeDefined()
    expect(token?.expires_at).toBeDefined()
    expect(new Date(token?.expires_at as string).toISOString()).toMatch(new Date('2024-12-31T23:59:59').toISOString())
  })

  it('should handle table creation with all constraints', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Test inserting a valid token
    await expect(db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token)
      VALUES ('App-Models-User', 1, 'Valid Token', 'valid-token')
    `).resolves.not.toThrow()

    // Test that required fields are enforced
    await expect(db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_id, name, token)
      VALUES (1, 'Missing Type', 'missing-type-token')
    `).rejects.toThrow() // Missing tokenable_type

    await expect(db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, name, token)
      VALUES ('App-Models-User', 'Missing ID', 'missing-id-token')
    `).rejects.toThrow() // Missing tokenable_id

    await expect(db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, token)
      VALUES ('App-Models-User', 1, 'missing-name-token')
    `).rejects.toThrow() // Missing name

    await expect(db.sql`
      INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name)
      VALUES ('App-Models-User', 1, 'Missing Token')
    `).rejects.toThrow() // Missing token
  })

  it('should handle tokenable_type field correctly', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Test with various tokenable_type formats
    const testTypes = [
      'App-Models-User',
      'App\\Models\\Admin',
      'App\\Models\\ApiClient',
      'Custom\\Namespace\\Model'
    ]

    for (const type of testTypes) {
      const token = `token-${type.replace(/[^a-z0-9]/gi, '')}`
      await expect(db.sql`
        INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token)
        VALUES (${type}, 1, ${`Token for ${type}`}, ${token})
      `).resolves.not.toThrow()
    }

    // Verify all types were stored correctly
    const result = await db.sql`SELECT tokenable_type FROM ${testOptions.tables.personalAccessTokens}`
    const storedTypes = result.rows?.map(row => row.tokenable_type) || []
    expect(storedTypes).toHaveLength(testTypes.length)
    testTypes.forEach((type) => {
      expect(storedTypes).toContain(type)
    })
  })

  it('should handle tokenable_id field correctly', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Test with various tokenable_id values
    const testIds = [1, 100, 999999, 0]

    for (const id of testIds) {
      const token = `token-id-${id}`
      await expect(db.sql`
        INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token)
        VALUES ('App-Models-User', ${id}, ${`Token for ID ${id}`}, ${token})
      `).resolves.not.toThrow()
    }

    // Verify all IDs were stored correctly
    const result = await db.sql`SELECT tokenable_id FROM ${testOptions.tables.personalAccessTokens}`
    const storedIds = result.rows?.map(row => row.tokenable_id) || []
    expect(storedIds).toHaveLength(testIds.length)
    testIds.forEach((id) => {
      expect(storedIds).toContain(id)
    })
  })

  it('should handle name field correctly', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Test with various name formats
    const testNames = [
      'Simple Token',
      'Token with spaces',
      'Token-with-dashes',
      'Token_with_underscores',
      'Token123',
      'TOKEN UPPERCASE',
      'Token with special chars!@#$%'
    ]

    for (const name of testNames) {
      const token = `token-${name.replace(/[^a-z0-9]/gi, '')}`
      await expect(db.sql`
        INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token)
        VALUES ('App-Models-User', 1, ${name}, ${token})
      `).resolves.not.toThrow()
    }

    // Verify all names were stored correctly
    const result = await db.sql`SELECT name FROM ${testOptions.tables.personalAccessTokens}`
    const storedNames = result.rows?.map(row => row.name) || []
    expect(storedNames).toHaveLength(testNames.length)
    testNames.forEach((name) => {
      expect(storedNames).toContain(name)
    })
  })

  it('should handle token field correctly', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Test with various token formats
    const testTokens = [
      'simple-token',
      'token-with-dashes',
      'token_with_underscores',
      'token123',
      'TOKEN-UPPERCASE',
      'token-with-special-chars!@#$%',
    ]

    for (const token of testTokens) {
      await expect(db.sql`
        INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token)
        VALUES ('App-Models-User', 1, ${`Token for ${token}`}, ${token})
      `).resolves.not.toThrow()
    }

    // Verify all tokens were stored correctly
    const result = await db.sql`SELECT token FROM ${testOptions.tables.personalAccessTokens}`
    const storedTokens = result.rows?.map(row => row.token) || []
    expect(storedTokens).toHaveLength(testTokens.length)
    testTokens.forEach((token) => {
      expect(storedTokens).toContain(token)
    })
  })

  it('should handle abilities field correctly', async () => {
    await createPersonalAccessTokensTable(testOptions)

    // Test with various abilities formats
    const testAbilities = [
      null,
      '["read"]',
      '["read", "write"]',
      '["read", "write", "delete"]',
      '["admin"]',
      '["custom-ability"]'
    ]

    for (const abilities of testAbilities) {
      const token = `token-abilities-${abilities ? abilities.replace(/[^a-z0-9]/gi, '') : 'null'}`
      if (abilities === null) {
        await expect(db.sql`
          INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token)
          VALUES ('App-Models-User', 1, ${`Token for ${abilities}`}, ${token})
        `).resolves.not.toThrow()
      }
      else {
        await expect(db.sql`
          INSERT INTO ${testOptions.tables.personalAccessTokens} (tokenable_type, tokenable_id, name, token, abilities)
          VALUES ('App-Models-User', 1, ${`Token for ${abilities}`}, ${token}, ${abilities})
        `).resolves.not.toThrow()
      }
    }

    // Verify abilities were stored correctly
    const result = await db.sql`SELECT abilities FROM ${testOptions.tables.personalAccessTokens}`
    const storedAbilities = result.rows?.map(row => row.abilities) || []
    expect(storedAbilities).toHaveLength(testAbilities.length)
    testAbilities.forEach((ability) => {
      expect(storedAbilities).toContain(ability)
    })
  })
})
