import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ModuleOptions } from '../../src/types'
import type { H3Event } from 'h3'

// Mock the database and runtime config
const mockUseDb = vi.fn()
const mockUseRuntimeConfig = vi.fn()

vi.mock('#imports', () => ({
  useRuntimeConfig: mockUseRuntimeConfig
}))

vi.mock('../../src/runtime/server/utils/db', () => ({
  useDb: mockUseDb
}))

vi.mock('../../src/runtime/server/utils/user', () => ({
  getLastLoginTime: vi.fn().mockResolvedValue(null)
}))

const testInactiveUsers = [
  {
    id: 3,
    email: 'inactive1@example.com',
    name: 'Inactive One',
    role: 'user',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 4,
    email: 'inactive2@example.com',
    name: 'Inactive Two',
    role: 'user',
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z'
  }
]

const testOptions: ModuleOptions = {
  apiBasePath: '/api/nuxt-users',
  connector: {
    name: 'sqlite',
    options: {
      path: './_test-inactive',
    },
  },
  tables: {
    migrations: 'migrations',
    users: 'users',
    personalAccessTokens: 'personal_access_tokens',
    passwordResetTokens: 'password_reset_tokens',
  },
  passwordResetUrl: '/reset-password',
  emailConfirmationUrl: '/email-confirmation',
  auth: {
    whitelist: [],
    tokenExpiration: 1440,
    rememberMeExpiration: 30,
    permissions: {}
  },
  passwordValidation: {
    minLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
    preventCommonPasswords: false,
  },
  hardDelete: false,
  locale: {
    default: 'en',
    fallbackLocale: 'en',
    texts: {}
  }
}

describe('Inactive Users API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseRuntimeConfig.mockReturnValue({
      nuxtUsers: testOptions
    })
  })

  it('should return inactive users with pagination', async () => {
    const mockEvent = { path: '/api/nuxt-users/inactive?page=1&limit=10', context: { params: {} } } as H3Event

    const mockDb = {
      sql: vi.fn()
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({ rows: testInactiveUsers })
    }

    mockUseDb.mockResolvedValue(mockDb)

    const { default: inactiveApiEndpoint } = await import('../../src/runtime/server/api/nuxt-users/inactive.get')

    const response = await inactiveApiEndpoint(mockEvent)

    expect(response).toBeDefined()
    expect(response.users).toBeDefined()
    expect(response.pagination).toBeDefined()

    expect(response.users).toHaveLength(2)
    expect(response.users[0]?.id).toBe(3)
    expect(response.users[0]?.email).toBe('inactive1@example.com')
    expect(response.users[1]?.id).toBe(4)
    expect(response.users[1]?.email).toBe('inactive2@example.com')

    expect(response.pagination.page).toBe(1)
    expect(response.pagination.limit).toBe(10)
    expect(response.pagination.total).toBe(2)
    expect(response.pagination.totalPages).toBe(1)
    expect(response.pagination.hasNext).toBe(false)
    expect(response.pagination.hasPrev).toBe(false)

    expect(mockDb.sql).toHaveBeenCalledTimes(2)
  })

  it('should handle invalid pagination parameters', async () => {
    const mockEvent = { path: '/api/nuxt-users/inactive?page=0&limit=200', context: { params: {} } } as H3Event

    const { default: inactiveApiEndpoint } = await import('../../src/runtime/server/api/nuxt-users/inactive.get')

    await expect(inactiveApiEndpoint(mockEvent)).rejects.toThrow('Invalid pagination parameters')
  })

  it('should handle database errors gracefully', async () => {
    const mockEvent = { path: '/api/nuxt-users/inactive?page=1&limit=10', context: { params: {} } } as H3Event

    const mockDb = {
      sql: vi.fn().mockRejectedValue(new Error('Database connection failed'))
    }
    mockUseDb.mockResolvedValue(mockDb)

    const { default: inactiveApiEndpoint } = await import('../../src/runtime/server/api/nuxt-users/inactive.get')

    await expect(inactiveApiEndpoint(mockEvent)).rejects.toThrow('Error fetching users')
  })

  it('should use default pagination when no parameters provided', async () => {
    const mockEvent = { path: '/api/nuxt-users/inactive', context: { params: {} } } as H3Event

    const mockDb = {
      sql: vi.fn()
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] })
    }
    mockUseDb.mockResolvedValue(mockDb)

    const { default: inactiveApiEndpoint } = await import('../../src/runtime/server/api/nuxt-users/inactive.get')

    const response = await inactiveApiEndpoint(mockEvent)

    expect(response.pagination.page).toBe(1)
    expect(response.pagination.limit).toBe(10)
    expect(response.pagination.total).toBe(0)
    expect(response.pagination.totalPages).toBe(0)
  })
})
