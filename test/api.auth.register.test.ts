import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import { usersTable as usersTableGetter, getDb } from '../src/runtime/server/utils/db'
import type { RegisterRequest, RegisterResponse } from '../src/runtime/server/dto'

// Configure nuxtUsers for testing (use in-memory DB)
const nuxtUsersTestConfig = {
  nuxtUsers: {
    dbTestMode: true, // This should be picked up by db/index.ts via runtimeConfig
    runMigrations: true, // Ensure migrations run for the in-memory DB
    apiBasePath: '/auth', // Ensure this matches if not default
  },
}

describe('POST /auth/register', async () => {
  // @ts-ignore
  await setup({
    // Nuxt test setup options
    // server: true, // Ensure server is started
    // nuxtConfig for overriding module options or other parts of Nuxt config for tests
    nuxtConfig: {
      runtimeConfig: { ...nuxtUsersTestConfig }, // Pass test config to runtimeConfig
      modules: [ // Ensure your module is loaded
        '../src/module' // Adjust path to your module entry
      ],
      // If your module relies on other modules, add them here too.
    }
  })

  const usersTable = usersTableGetter.get()

  beforeAll(async () => {
    // Migrations should run automatically via the plugin if runMigrations is true
    // If not, or for manual control:
    // const db = getDb();
    // You might need to expose a migration function or ensure plugin runs
    // For now, assuming the plugin handles it with dbTestMode.
    console.log("Test setup: Ensuring in-memory DB is initialized and migrations run.")
  })

  afterEach(async () => {
    // Clear the users table after each test to ensure isolation
    // db0 doesn't have a direct `clear` or `truncate`. We might need to delete all items.
    // This is a placeholder; actual implementation depends on db0 capabilities.
    // For unstorage with memory driver, re-initializing storage might be an option,
    // or fetching all keys and deleting them.
    const allUsers = await usersTable.select().all()
    for (const user of allUsers) {
      await usersTable.delete().where({ id: user.id }).execute()
    }
    console.log("Cleaned users table after test.")
  })

  it('should register a new user successfully', async () => {
    const requestBody: RegisterRequest = {
      email: 'test@example.com',
      password: 'password123',
    }

    const response = await $fetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: requestBody,
    })

    expect(response.message).toBe('User registered successfully')
    expect(response.user).toBeDefined()
    expect(response.user.email).toBe(requestBody.email)
    expect(response.user.id).toBeDefined()

    // Verify user is in the database (without password)
    const dbUser = await usersTable.select({id: true, email: true}).where({ email: requestBody.email }).first()
    expect(dbUser).toBeDefined()
    expect(dbUser?.email).toBe(requestBody.email)
  })

  it('should fail to register if email already exists', async () => {
    const requestBody: RegisterRequest = {
      email: 'existing@example.com',
      password: 'password123',
    }
    // First, create the user
    await $fetch<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: requestBody,
    })

    // Then, attempt to register again with the same email
    try {
      await $fetch<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: requestBody,
      })
      // Should not reach here
      expect(true).toBe(false)
    } catch (error: any) {
      expect(error.statusCode).toBe(409)
      expect(error.data.statusMessage).toBe('User with this email already exists')
    }
  })

  it('should fail with 400 if email is missing', async () => {
    const requestBody = { password: 'password123' } as RegisterRequest;
    try {
      await $fetch<RegisterResponse>('/auth/register', { method: 'POST', body: requestBody });
      expect(true).toBe(false); // Fail test if request succeeds
    } catch (e: any) {
      expect(e.statusCode).toBe(400);
      expect(e.data.statusMessage).toBe('Missing email or password');
    }
  });

  it('should fail with 400 if password is too short', async () => {
    const requestBody: RegisterRequest = { email: 'shortpass@example.com', password: '123' };
    try {
      await $fetch<RegisterResponse>('/auth/register', { method: 'POST', body: requestBody });
      expect(true).toBe(false); // Fail test if request succeeds
    } catch (e: any) {
      expect(e.statusCode).toBe(400);
      expect(e.data.statusMessage).toBe('Password must be at least 8 characters long');
    }
  });

  it('should fail with 400 if email format is invalid', async () => {
    const requestBody: RegisterRequest = { email: 'invalidemail', password: 'password123' };
    try {
      await $fetch<RegisterResponse>('/auth/register', { method: 'POST', body: requestBody });
      expect(true).toBe(false); // Fail test if request succeeds
    } catch (e: any) {
      expect(e.statusCode).toBe(400);
      expect(e.data.statusMessage).toBe('Invalid email format');
    }
  });

})
