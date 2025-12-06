import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import { createUsersTable } from '../../src/runtime/server/utils/create-users-table'
import { createPasswordResetTokensTable } from '../../src/runtime/server/utils/create-password-reset-tokens-table'
import { addActiveToUsers } from '../../src/runtime/server/utils/add-active-to-users'
import type { ModuleOptions } from '../../src/types'
import { defaultOptions } from '../../src/module'

async function setupDatabaseTables() {
  // Use the default options which match the playground configuration
  // The playground uses SQLite with path './data/users.sqlite3' by default
  const options: ModuleOptions = {
    ...defaultOptions,
    connector: {
      name: 'sqlite',
      options: {
        path: './data/users.sqlite3'
      }
    }
  }

  // Create all required tables
  await createUsersTable(options)
  await addActiveToUsers(options)
  await createPasswordResetTokensTable(options)
}

describe('API: Registration', async () => {
  await setup({
    rootDir: './playground'
  })

  beforeEach(async () => {
    // Set up database tables before each test
    await setupDatabaseTables()
  })

  it('should register a new user successfully', async () => {
    // Registration should succeed even if email sending fails
    // The user account is created and email failure is handled gracefully
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
    const response = await $fetch('/api/nuxt-users/register', {
      method: 'POST',
      body: {
        email: uniqueEmail,
        name: 'Test User',
        password: 'testpass123'
      }
    })

    expect(response.user).toBeDefined()
    expect(response.user.email).toBe(uniqueEmail)
    expect(response.user.name).toBe('Test User')
    expect(response.message).toContain('Please check your email')
  })

  it('should reject registration with invalid email', async () => {
    await expect($fetch('/api/nuxt-users/register', {
      method: 'POST',
      body: {
        email: 'invalid-email',
        name: 'Test User',
        password: 'testpass123'
      }
    })).rejects.toThrow()
  })

  it('should reject registration with missing fields', async () => {
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
    await expect($fetch('/api/nuxt-users/register', {
      method: 'POST',
      body: {
        email: uniqueEmail
        // Missing name and password
      }
    })).rejects.toThrow()
  })

  it('should handle email confirmation with invalid token', async () => {
    // Test that the endpoint redirects for invalid tokens
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`

    // The API should redirect - in test environment this follows the redirect
    // and we get the final confirmation page HTML
    const response = await $fetch('/api/nuxt-users/confirm-email', {
      query: {
        token: 'invalid-token',
        email: uniqueEmail
      }
    })

    // Should get HTML page that contains the error message
    expect(typeof response).toBe('string')
    expect(response).toContain('html') // It's an HTML response
    // The error message will be in the URL or page content
    expect(response).toMatch(/Invalid.*expired.*confirmation.*token/i)
  })

  it('should handle email confirmation with missing parameters', async () => {
    // Test parameter validation - should redirect to error page
    const response = await $fetch('/api/nuxt-users/confirm-email', {
      query: {
        // Missing both token and email
      }
    })

    // Should get HTML page that contains the error message
    expect(typeof response).toBe('string')
    expect(response).toContain('html') // It's an HTML response
    // The error message will be in the URL or page content
    expect(response).toMatch(/Token.*email.*required/i)
  })
})
