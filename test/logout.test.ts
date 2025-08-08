import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { Database } from 'db0'
import { createUser } from '../src/runtime/server/utils/user'
import { createUsersTable } from '../src/runtime/server/utils/create-users-table'
import { createPersonalAccessTokensTable } from '../src/runtime/server/utils/create-personal-access-tokens-table'
import type { DatabaseConfig, DatabaseType, ModuleOptions, User } from '../src/types'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

import { cleanupTestSetup, createTestSetup } from './test-setup'

describe('Logout API Route', async () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig
  let testUser: Omit<User, 'password'>

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/login_logout', import.meta.url)),
  })

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_login_logout-test',
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

    await createUsersTable(testOptions)
    await createPersonalAccessTokensTable(testOptions)

    // Create a test user
    testUser = await createUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    }, testOptions)
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.personalAccessTokens)
  })

  it('should logout successfully and clear token', async () => {
    // Create a mock token directly in the database
    const mockToken = crypto.randomBytes(64).toString('hex')
    const personalAccessTokensTable = testOptions.tables.personalAccessTokens

    await db.sql`
      INSERT INTO {${personalAccessTokensTable}} (tokenable_type, tokenable_id, name, token, created_at, updated_at)
      VALUES ('user', ${testUser.id}, 'auth_token', ${mockToken}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    // Check that token exists in database
    const tokenBeforeLogout = await db.sql`
      SELECT * FROM {${personalAccessTokensTable}} WHERE tokenable_id = ${testUser.id}
    ` as { rows: Array<{ token: string }> }
    expect(tokenBeforeLogout.rows.length).toBe(1)

    // Now logout with the mock token
    const logoutResponse = await $fetch<{ message: string }>('/api/nuxt-users/session', {
      method: 'DELETE',
      headers: {
        Cookie: `auth_token=${mockToken}`
      }
    })

    expect(logoutResponse.message).toBe('Logged out successfully')

    // Check that token was deleted from database
    const tokenAfterLogout = await db.sql`
      SELECT * FROM {${personalAccessTokensTable}} WHERE tokenable_id = ${testUser.id}
    ` as { rows: Array<{ token: string }> }
    expect(tokenAfterLogout.rows.length).toBe(0)
  })

  it('should handle logout without existing token gracefully', async () => {
    const logoutResponse = await $fetch<{ message: string }>('/api/nuxt-users/session', {
      method: 'DELETE'
    })

    expect(logoutResponse.message).toBe('Logged out successfully')
  })
})
