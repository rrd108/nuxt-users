import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch, createPage } from '@nuxt/test-utils'

describe('API: Registration', async () => {
  await setup({
    rootDir: './playground'
  })

  beforeEach(async () => {
    // Clean up any existing test users
    try {
      await $fetch('/api/nuxt-users', { 
        method: 'DELETE',
        query: { email: 'test@example.com' }
      })
    } catch {
      // Ignore errors if user doesn't exist
    }
  })

  it('should register a new user successfully', async () => {
    const response = await $fetch('/api/nuxt-users/register', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'testpass123'
      }
    })

    expect(response.user).toBeDefined()
    expect(response.user.email).toBe('test@example.com')
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
    await expect($fetch('/api/nuxt-users/register', {
      method: 'POST',
      body: {
        email: 'test@example.com'
        // Missing name and password
      }
    })).rejects.toThrow()
  })

  it('should handle email confirmation', async () => {
    // This test would require mocking the token generation
    // For now, just test that the endpoint exists
    await expect($fetch('/api/nuxt-users/confirm-email', {
      query: {
        token: 'invalid-token',
        email: 'test@example.com'
      }
    })).rejects.toThrow('Invalid or expired')
  })
})
