import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEvent } from 'h3'
import type { ModuleOptions } from '../../src/types'

// Mock the database and runtime config
const mockUseDb = vi.fn()
const mockUseRuntimeConfig = vi.fn()

vi.mock('#imports', () => ({
  useRuntimeConfig: mockUseRuntimeConfig
}))

vi.mock('../../src/runtime/server/utils/db', () => ({
  useDb: mockUseDb
}))

// Mock test data
const testUsers = [
  {
    id: 1,
    email: 'user1@example.com',
    name: 'User One',
    role: 'user',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    email: 'user2@example.com',
    name: 'User Two',
    role: 'admin',
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z'
  }
]

const testOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './test.sqlite'
    }
  },
  tables: {
    users: 'users',
    personalAccessTokens: 'personal_access_tokens',
    passwordResetTokens: 'password_reset_tokens'
  },
  auth: {
    whitelist: [],
    permissions: {}
  },
  passwordValidation: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true
  }
}

describe('Users List API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock runtime config
    mockUseRuntimeConfig.mockReturnValue({
      nuxtUsers: testOptions
    })

    // Mock database
    const mockDb = {
      sql: vi.fn()
    }
    mockUseDb.mockResolvedValue(mockDb)
  })

  it('should return users with pagination', async () => {
    const mockEvent = createEvent({
      method: 'GET',
      url: '/api/nuxt-users?page=1&limit=2'
    })

    // Mock database responses
    const mockDb = {
      sql: vi.fn()
        .mockResolvedValueOnce({ rows: [{ total: 2 }] }) // Count query
        .mockResolvedValueOnce({ rows: testUsers }) // Users query
    }
    mockUseDb.mockResolvedValue(mockDb)

    // Import the handler
    const { default: usersListApiEndpoint } = await import('../../src/runtime/server/api/nuxt-users/index.get')

    // Call the handler
    const response = await usersListApiEndpoint(mockEvent)

    // Verify response structure
    expect(response).toBeDefined()
    expect(response.users).toBeDefined()
    expect(response.pagination).toBeDefined()

    // Verify users data
    expect(response.users).toHaveLength(2)
    expect(response.users[0].id).toBe(1)
    expect(response.users[0].email).toBe('user1@example.com')
    expect(response.users[1].id).toBe(2)
    expect(response.users[1].email).toBe('user2@example.com')

    // Verify pagination data
    expect(response.pagination.page).toBe(1)
    expect(response.pagination.limit).toBe(2)
    expect(response.pagination.total).toBe(2)
    expect(response.pagination.totalPages).toBe(1)
    expect(response.pagination.hasNext).toBe(false)
    expect(response.pagination.hasPrev).toBe(false)

    // Verify database calls
    expect(mockDb.sql).toHaveBeenCalledTimes(2)
  })

  it('should handle invalid pagination parameters', async () => {
    const mockEvent = createEvent({
      method: 'GET',
      url: '/api/nuxt-users?page=0&limit=200'
    })

    // Import the handler
    const { default: usersListApiEndpoint } = await import('../../src/runtime/server/api/nuxt-users/index.get')

    // Expect error for invalid parameters
    await expect(usersListApiEndpoint(mockEvent)).rejects.toThrow('Invalid pagination parameters')
  })

  it('should handle database errors gracefully', async () => {
    const mockEvent = createEvent({
      method: 'GET',
      url: '/api/nuxt-users?page=1&limit=10'
    })

    // Mock database error
    const mockDb = {
      sql: vi.fn().mockRejectedValue(new Error('Database connection failed'))
    }
    mockUseDb.mockResolvedValue(mockDb)

    // Import the handler
    const { default: usersListApiEndpoint } = await import('../../src/runtime/server/api/nuxt-users/index.get')

    // Expect error
    await expect(usersListApiEndpoint(mockEvent)).rejects.toThrow('Error fetching users')
  })

  it('should use default pagination when no parameters provided', async () => {
    const mockEvent = createEvent({
      method: 'GET',
      url: '/api/nuxt-users'
    })

    // Mock database responses
    const mockDb = {
      sql: vi.fn()
        .mockResolvedValueOnce({ rows: [{ total: 0 }] }) // Count query
        .mockResolvedValueOnce({ rows: [] }) // Users query
    }
    mockUseDb.mockResolvedValue(mockDb)

    // Import the handler
    const { default: usersListApiEndpoint } = await import('../../src/runtime/server/api/nuxt-users/index.get')

    // Call the handler
    const response = await usersListApiEndpoint(mockEvent)

    // Verify default pagination
    expect(response.pagination.page).toBe(1)
    expect(response.pagination.limit).toBe(10)
    expect(response.pagination.total).toBe(0)
    expect(response.pagination.totalPages).toBe(0)
  })
})
