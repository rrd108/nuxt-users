import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('API: Registration', async () => {
  await setup({
    rootDir: './playground'
  })

  beforeEach(async () => {
    // Clean up any existing test users
    // Clean up any existing test users - we'll use a different approach
    // since the DELETE method isn't available on the users endpoint
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

  it('should handle email confirmation', async () => {
    // This test would require mocking the token generation
    // For now, just test that the endpoint exists
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
    await expect($fetch('/api/nuxt-users/confirm-email', {
      query: {
        token: 'invalid-token',
        email: uniqueEmail
      }
    })).rejects.toThrow('Invalid or expired')
  })
})
