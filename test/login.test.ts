import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { createUser } from '../src/runtime/server/utils/create-user'
import { createUsersTable } from '../src/runtime/server/utils/create-users-table'
import type { ModuleOptions, User } from '../src/types'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'pathe'

const dbPath = resolve(fileURLToPath(import.meta.url), '../fixtures/login/_db.sqlite3')
// Default options for creating a user in tests
// This path should now point to the DB inside the fixture
const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      // Path relative to the project root, pointing inside the fixture
      path: dbPath,
    },
  },
}

// dbPath will be resolved to an absolute path by fileURLToPath

describe('Login API Route', async () => {
  // Set up database before starting the Nuxt server
  console.log('Setting up test database...')

  // Delete existing database file before tests
  try {
    await fs.unlink(dbPath)
    console.log(`Deleted existing database file: ${dbPath}`)
  }
  catch (error: unknown) {
    const fsError = error as { code?: string }
    if (fsError.code !== 'ENOENT') { // Ignore if file doesn't exist
      console.log(`Database file doesn't exist yet: ${dbPath}`)
    }
  }

  // Create the users table
  await createUsersTable('users', defaultOptions)
  console.log('Users table created successfully for tests.')

  // Create a test user before starting the server
  await createUser({
    email: 'rrd@webmania.cc',
    name: 'Test User',
    password: 'Gauranga-108',
  }, defaultOptions)

  console.log('Test user created successfully.')

  await setup({
    // rootDir now points to the login fixture which has the module configured
    rootDir: fileURLToPath(new URL('./fixtures/login', import.meta.url)),
  })

  beforeEach(async () => {
    // No need to recreate the database for each test since we're using the same file
    console.log('Test starting...')
  })

  it('should login successfully with correct credentials', async () => {
    console.log('Testing login with correct credentials...')

    const response = await $fetch('/api/login', { // $fetch should be pre-configured by setup
      method: 'POST',
      body: {
        email: 'rrd@webmania.cc',
        password: 'Gauranga-108',
      },
    }) as { user: User }

    expect(response.user).toBeDefined()
    expect(response.user.email).toBe('rrd@webmania.cc')
    expect(response.user.name).toBe('Test User')
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
