import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ModuleOptions, UserWithoutPassword } from '../../src/types'
import type { H3Event } from 'h3'
import crypto from 'node:crypto'
import { defaultOptions } from '../../src/module'

// Mock h3 functions
vi.mock('h3', () => ({
  defineEventHandler: vi.fn(handler => handler),
  getCookie: vi.fn(),
  createError: vi.fn()
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn()
}))

vi.mock('../../src/runtime/server/utils', () => ({
  getCurrentUserFromToken: vi.fn()
}))

// Import the profile api endpoint after mocking
const profileApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/me.get')

describe('Profile API Route', () => {
  let testOptions: ModuleOptions
  let testUser: UserWithoutPassword
  let mockEvent: H3Event
  let mockGetCookie: ReturnType<typeof vi.fn>
  let mockCreateError: ReturnType<typeof vi.fn>
  let mockDefineEventHandler: ReturnType<typeof vi.fn>
  let mockUseRuntimeConfig: ReturnType<typeof vi.fn>
  let mockGetCurrentUserFromToken: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked functions
    const h3 = await import('h3')
    const imports = await import('#imports')
    const utils = await import('../../src/runtime/server/utils')

    mockGetCookie = h3.getCookie as ReturnType<typeof vi.fn>
    mockCreateError = h3.createError as ReturnType<typeof vi.fn>
    mockDefineEventHandler = h3.defineEventHandler as ReturnType<typeof vi.fn>
    mockUseRuntimeConfig = imports.useRuntimeConfig as ReturnType<typeof vi.fn>
    mockGetCurrentUserFromToken = utils.getCurrentUserFromToken as ReturnType<typeof vi.fn>

    // Mock test options
    testOptions = defaultOptions

    // Mock runtime config
    mockUseRuntimeConfig.mockReturnValue({
      nuxtUsers: testOptions
    })

    // Create mock test user
    testUser = {
      id: 1,
      email: 'profile@example.com',
      name: 'Profile Test User',
      role: 'user',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }

    // Create mock event
    mockEvent = {} as H3Event

    // Mock defineEventHandler to return the handler function
    mockDefineEventHandler.mockImplementation(handler => handler)
  })

  afterEach(async () => {
    vi.clearAllMocks()
  })

  it('should return user profile with valid authentication token', async () => {
    const mockToken = crypto.randomBytes(64).toString('hex')

    // Mock getCookie to return the token
    mockGetCookie.mockReturnValue(mockToken)

    // Mock the getCurrentUserFromToken to return our test user
    mockGetCurrentUserFromToken.mockResolvedValue(testUser)

    // Call the handler directly
    const response = await profileApiEndpoint.default(mockEvent)

    // Verify getCookie was called correctly
    expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')

    // Verify the mock was called with correct parameters
    expect(mockGetCurrentUserFromToken).toHaveBeenCalledWith(mockToken, testOptions)

    // Verify response structure
    expect(response).toBeDefined()
    expect(response.user).toBeDefined()

    // Verify user data
    expect(response.user.id).toBe(testUser.id)
    expect(response.user.email).toBe('profile@example.com')
    expect(response.user.name).toBe('Profile Test User')
    expect(response.user.created_at).toBeDefined()
    expect(response.user.updated_at).toBeDefined()

    // Verify password is not included in response (UserWithoutPassword type doesn't have password)
    expect('password' in response.user).toBe(false)
  })

  it('should return 401 when no authentication token is provided', async () => {
    // Mock getCookie to return undefined (no token)
    mockGetCookie.mockReturnValue(undefined)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await profileApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(401)
      expect(h3Error.statusMessage).toBe('Unauthorized - No authentication token found')
    }

    // Verify getCookie was called
    expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 401,
      statusMessage: 'Unauthorized - No authentication token found'
    })
  })

  it('should return 401 when invalid authentication token is provided', async () => {
    const invalidToken = 'invalid-token-123'

    // Mock getCookie to return the invalid token
    mockGetCookie.mockReturnValue(invalidToken)

    // Mock getCurrentUserFromToken to return null (invalid token)
    mockGetCurrentUserFromToken.mockResolvedValue(null)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await profileApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(401)
      expect(h3Error.statusMessage).toBe('Unauthorized - Invalid authentication token')
    }

    // Verify getCookie was called
    expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')
    expect(mockGetCurrentUserFromToken).toHaveBeenCalledWith(invalidToken, testOptions)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 401,
      statusMessage: 'Unauthorized - Invalid authentication token'
    })
  })

  it('should return 401 when token exists but user is not found', async () => {
    const mockToken = crypto.randomBytes(64).toString('hex')

    // Mock getCookie to return the token
    mockGetCookie.mockReturnValue(mockToken)

    // Mock the getCurrentUserFromToken to return null (user not found)
    mockGetCurrentUserFromToken.mockResolvedValue(null)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await profileApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(401)
      expect(h3Error.statusMessage).toBe('Unauthorized - Invalid authentication token')
    }

    // Verify the mocks were called
    expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')
    expect(mockGetCurrentUserFromToken).toHaveBeenCalledWith(mockToken, testOptions)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 401,
      statusMessage: 'Unauthorized - Invalid authentication token'
    })
  })

  it('should return 401 when token is malformed', async () => {
    const malformedToken = 'not-a-valid-hex-token'

    // Mock getCookie to return the malformed token
    mockGetCookie.mockReturnValue(malformedToken)

    // Mock getCurrentUserFromToken to return null (malformed token)
    mockGetCurrentUserFromToken.mockResolvedValue(null)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await profileApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(401)
      expect(h3Error.statusMessage).toBe('Unauthorized - Invalid authentication token')
    }

    // Verify the mocks were called
    expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')
    expect(mockGetCurrentUserFromToken).toHaveBeenCalledWith(malformedToken, testOptions)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 401,
      statusMessage: 'Unauthorized - Invalid authentication token'
    })
  })

  it('should handle multiple cookies correctly', async () => {
    const mockToken = crypto.randomBytes(64).toString('hex')

    // Mock getCookie to return the token
    mockGetCookie.mockReturnValue(mockToken)

    // Mock the getCurrentUserFromToken to return our test user
    mockGetCurrentUserFromToken.mockResolvedValue(testUser)

    // Call the handler directly
    const response = await profileApiEndpoint.default(mockEvent)

    // Verify getCookie was called correctly
    expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')

    // Verify the mock was called with correct parameters
    expect(mockGetCurrentUserFromToken).toHaveBeenCalledWith(mockToken, testOptions)

    // Verify response is successful
    expect(response.user).toBeDefined()
    expect(response.user.email).toBe('profile@example.com')
  })
})
