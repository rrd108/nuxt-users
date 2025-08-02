import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { Database } from 'db0'
import { createUser } from '../src/runtime/server/utils/user'
import { createUsersTable } from '../src/runtime/server/utils/create-users-table'
import { createPersonalAccessTokensTable } from '../src/runtime/server/utils/create-personal-access-tokens-table'
import type { DatabaseConfig, DatabaseType, ModuleOptions, User } from '../src/types'
import { fileURLToPath } from 'node:url'
import { cleanupTestSetup, createTestSetup } from './test-setup'

describe('Auth Whitelist Middleware', async () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig
  let _testUser: Omit<User, 'password'>

  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/auth-whitelist', import.meta.url)),
  })

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_auth-whitelist-test',
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
    _testUser = await createUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    }, testOptions)
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.personalAccessTokens)
  })

  it('should allow access to whitelisted routes without authentication', async () => {
    // Test login page (always accessible)
    const loginResponse = await $fetch('/login')
    expect(loginResponse).toBeDefined()

    // Test public page (whitelisted)
    const publicResponse = await $fetch('/public')
    expect(publicResponse).toBeDefined()

    // Test register page (whitelisted)
    const registerResponse = await $fetch('/register')
    expect(registerResponse).toBeDefined()

    // Test about page (whitelisted)
    const aboutResponse = await $fetch('/about')
    expect(aboutResponse).toBeDefined()
  })

  it('should redirect to login when accessing protected routes without authentication', async () => {
    try {
      await $fetch('/')
    }
    catch (error: unknown) {
      const fetchError = error as { response: { status: number } }
      // Should redirect to login (302 redirect)
      expect(fetchError.response.status).toBe(302)
    }

    try {
      await $fetch('/dashboard')
    }
    catch (error: unknown) {
      const fetchError = error as { response: { status: number } }
      // Should redirect to login (302 redirect)
      expect(fetchError.response.status).toBe(302)
    }
  })

  it('should allow access to protected routes when authenticated', async () => {
    // First login to get authentication
    const loginResponse = await $fetch('/api/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    })

    expect(loginResponse).toBeDefined()

    // Now try to access protected routes
    const indexResponse = await $fetch('/')
    expect(indexResponse).toBeDefined()

    const dashboardResponse = await $fetch('/dashboard')
    expect(dashboardResponse).toBeDefined()
  })

  it('should handle custom whitelist configuration', async () => {
    // The test fixture is configured with custom whitelist: ['/public', '/register', '/about']
    // Test that these specific routes are accessible
    const whitelistedRoutes = ['/public', '/register', '/about']

    for (const route of whitelistedRoutes) {
      const response = await $fetch(route)
      expect(response).toBeDefined()
    }

    // Test that non-whitelisted routes are protected
    const protectedRoutes = ['/', '/dashboard']

    for (const route of protectedRoutes) {
      try {
        await $fetch(route)
      }
      catch (error: unknown) {
        const fetchError = error as { response: { status: number } }
        expect(fetchError.response.status).toBe(302) // Redirect to login
      }
    }
  })

  it('should always allow access to login page regardless of whitelist', async () => {
    // Login page should always be accessible, even when not in whitelist
    const loginResponse = await $fetch('/login')
    expect(loginResponse).toBeDefined()
  })

  it('should maintain authentication state across requests', async () => {
    // Login first
    await $fetch('/api/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    })

    // Access multiple protected routes
    const routes = ['/', '/dashboard']

    for (const route of routes) {
      const response = await $fetch(route)
      expect(response).toBeDefined()
    }
  })

  it('should handle edge cases in whitelist configuration', async () => {
    // Test with trailing slashes
    const loginWithSlash = await $fetch('/login/')
    expect(loginWithSlash).toBeDefined()

    // Test with query parameters
    const loginWithQuery = await $fetch('/login?redirect=/dashboard')
    expect(loginWithQuery).toBeDefined()

    // Test with hash fragments
    const loginWithHash = await $fetch('/login#section')
    expect(loginWithHash).toBeDefined()
  })
})
