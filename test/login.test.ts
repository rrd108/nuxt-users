import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { Database } from 'db0'
import { createUser } from '../src/runtime/server/utils/user'
import { createUsersTable } from '../src/runtime/server/utils/create-users-table'
import { createPersonalAccessTokensTable } from '../src/runtime/server/utils/create-personal-access-tokens-table'
import type { DatabaseConfig, DatabaseType, ModuleOptions, User } from '../src/types'
import { fileURLToPath } from 'node:url'
import { createDatabase } from 'db0'
import { getConnector } from '../src/runtime/server/utils/db'
import { cleanupTestSetup, createTestSetup } from './utils/test-setup'

describe('Login API Route', async () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig
  let testUser: Omit<User, 'password'>

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/login', import.meta.url)),
  })

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_login-test',
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

    

    await createUsersTable(testOptions)
    await createPersonalAccessTokensTable(testOptions)

    // Create a test user
    testUser = await createUser({
      email: 'rrd@webmania.cc',
      name: 'Test User',
      password: 'Gauranga-108',
    }, testOptions)
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], 'users')
  })

  it('should login successfully, set cookie, and store token', async () => {
    const response = await $fetch('/api/login', {
      method: 'POST',
      body: {
        email: 'rrd@webmania.cc',
        password: 'Gauranga-108',
      },
    })

    const responseBody = response as { user: User }

    expect(responseBody.user).toBeDefined()
    expect(responseBody.user.email).toBe('rrd@webmania.cc')
    expect(responseBody.user.name).toBe('Test User')

    // Check token in database
    const connector = await getConnector(testOptions.connector!.name)
    const db = createDatabase(connector(testOptions.connector!.options))
    const tokenRecord = await db.sql`SELECT * FROM personal_access_tokens WHERE tokenable_id = ${testUser.id}` as { rows: Array<{ name: string, tokenable_type: string, token: string }> }
    expect(tokenRecord.rows.length).toBe(1)
    expect(tokenRecord.rows[0].name).toBe('auth_token')
    expect(tokenRecord.rows[0].tokenable_type).toBe('user')
  })

  it('should return 401 for incorrect email', async () => {
    try {
      await $fetch('/api/login', {
        method: 'POST',
        body: {
          email: 'wrong@example.com',
          password: 'Gauranga-108',
        },
      })
    }
    catch (error: unknown) {
      const fetchError = error as { response: { status: number, _data: { statusMessage: string } } }
      expect(fetchError.response.status).toBe(401)
      expect(fetchError.response._data.statusMessage).toBe('Invalid email or password')
    }
  })

  it('should return 401 for incorrect password', async () => {
    try {
      await $fetch('/api/login', {
        method: 'POST',
        body: {
          email: 'rrd@webmania.cc',
          password: 'wrongpassword',
        },
      })
    }
    catch (error: unknown) {
      const fetchError = error as { response: { status: number, _data: { statusMessage: string } } }
      expect(fetchError.response.status).toBe(401)
      expect(fetchError.response._data.statusMessage).toBe('Invalid email or password')
    }
  })

  it('should return 400 for missing email', async () => {
    try {
      await $fetch('/api/login', {
        method: 'POST',
        body: {
          password: 'Gauranga-108',
        },
      })
    }
    catch (error: unknown) {
      const fetchError = error as { response: { status: number, _data: { statusMessage: string } } }
      expect(fetchError.response.status).toBe(400)
      expect(fetchError.response._data.statusMessage).toBe('Email and password are required')
    }
  })

  it('should return 400 for missing password', async () => {
    try {
      await $fetch('/api/login', {
        method: 'POST',
        body: {
          email: 'rrd@webmania.cc',
        },
      })
    }
    catch (error: unknown) {
      const fetchError = error as { response: { status: number, _data: { statusMessage: string } } }
      expect(fetchError.response.status).toBe(400)
      expect(fetchError.response._data.statusMessage).toBe('Email and password are required')
    }
  })
})
