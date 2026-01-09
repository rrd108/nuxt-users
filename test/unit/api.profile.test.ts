import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ModuleOptions, UserWithoutPassword, User } from '../../src/types'
import type { H3Event } from 'h3'
import crypto from 'node:crypto'
import { defaultOptions } from '../../src/module'

// Mock h3 functions
vi.mock('h3', () => ({
  defineEventHandler: vi.fn(handler => handler),
  getCookie: vi.fn(),
  createError: vi.fn(),
  readBody: vi.fn()
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn()
}))

vi.mock('../../src/runtime/server/utils', () => ({
  getCurrentUserFromToken: vi.fn(),
  updateUserPassword: vi.fn()
}))

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn()
  }
}))

vi.mock('../../src/utils', () => ({
  validatePassword: vi.fn(),
  getPasswordValidationOptions: vi.fn()
}))

// Import the profile api endpoint after mocking
const profileApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/me.get')

// Import the password change api endpoint after mocking
const passwordChangeApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/password/index.patch')

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
      updated_at: '2024-01-01T00:00:00.000Z',
      active: true
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

describe('Password Change API Route', () => {
  let testOptions: ModuleOptions
  let testUserWithPassword: User
  let mockEvent: H3Event
  let mockGetCookie: ReturnType<typeof vi.fn>
  let mockReadBody: ReturnType<typeof vi.fn>
  let _mockCreateError: ReturnType<typeof vi.fn>
  let _mockDefineEventHandler: ReturnType<typeof vi.fn>
  let mockUseRuntimeConfig: ReturnType<typeof vi.fn>
  let mockGetCurrentUserFromToken: ReturnType<typeof vi.fn>
  let mockUpdateUserPassword: ReturnType<typeof vi.fn>
  let mockBcryptCompare: ReturnType<typeof vi.fn>
  let mockValidatePassword: ReturnType<typeof vi.fn>
  let mockGetPasswordValidationOptions: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked functions
    const h3 = await import('h3')
    const imports = await import('#imports')
    const utils = await import('../../src/runtime/server/utils')
    const bcrypt = await import('bcrypt')
    const passwordUtils = await import('../../src/utils')

    mockGetCookie = h3.getCookie as ReturnType<typeof vi.fn>
    mockReadBody = h3.readBody as ReturnType<typeof vi.fn>
    _mockCreateError = h3.createError as ReturnType<typeof vi.fn>
    _mockDefineEventHandler = h3.defineEventHandler as ReturnType<typeof vi.fn>
    mockUseRuntimeConfig = imports.useRuntimeConfig as ReturnType<typeof vi.fn>
    mockGetCurrentUserFromToken = utils.getCurrentUserFromToken as ReturnType<typeof vi.fn>
    mockUpdateUserPassword = utils.updateUserPassword as ReturnType<typeof vi.fn>
    mockBcryptCompare = bcrypt.default.compare as ReturnType<typeof vi.fn>
    mockValidatePassword = passwordUtils.validatePassword as ReturnType<typeof vi.fn>
    mockGetPasswordValidationOptions = passwordUtils.getPasswordValidationOptions as ReturnType<typeof vi.fn>

    // Mock test options
    testOptions = defaultOptions

    // Mock runtime config
    mockUseRuntimeConfig.mockReturnValue({
      nuxtUsers: testOptions
    })

    // Create mock test user with password (needed for password change)
    testUserWithPassword = {
      id: 1,
      email: 'profile@example.com',
      name: 'Profile Test User',
      role: 'user',
      password: '$2a$10$hashedPasswordHere',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      active: true
    }

    // Create mock event
    mockEvent = {} as H3Event

    // Mock defineEventHandler to return the handler function
    _mockDefineEventHandler.mockImplementation((handler: unknown) => handler)

    // Mock password validation options
    mockGetPasswordValidationOptions.mockReturnValue({
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      preventCommonPasswords: false
    })
  })

  afterEach(async () => {
    vi.clearAllMocks()
  })

  it('should allow authenticated users to change their password', async () => {
    const mockToken = crypto.randomBytes(64).toString('hex')
    const currentPassword = 'OldPassword123'
    const newPassword = 'NewPassword123'
    const requestBody = {
      currentPassword,
      newPassword,
      newPasswordConfirmation: newPassword
    }

    // Mock getCookie to return the token
    mockGetCookie.mockReturnValue(mockToken)

    // Mock getCurrentUserFromToken to return user with password (third param true)
    mockGetCurrentUserFromToken.mockResolvedValue(testUserWithPassword)

    // Mock readBody to return the password change request
    mockReadBody.mockResolvedValue(requestBody)

    // Mock bcrypt.compare to return true (current password matches)
    mockBcryptCompare.mockResolvedValue(true)

    // Mock password validation to succeed
    mockValidatePassword.mockReturnValue({
      isValid: true,
      errors: []
    })

    // Mock updateUserPassword to succeed
    mockUpdateUserPassword.mockResolvedValue(undefined)

    // Call the handler directly
    const response = await passwordChangeApiEndpoint.default(mockEvent)

    // Verify getCookie was called correctly
    expect(mockGetCookie).toHaveBeenCalledWith(mockEvent, 'auth_token')

    // Verify getCurrentUserFromToken was called with includePassword = true
    expect(mockGetCurrentUserFromToken).toHaveBeenCalledWith(mockToken, testOptions, true)

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)

    // Verify password validation was called
    expect(mockGetPasswordValidationOptions).toHaveBeenCalledWith(testOptions)
    expect(mockValidatePassword).toHaveBeenCalledWith(newPassword, expect.any(Object))

    // Verify current password was checked
    expect(mockBcryptCompare).toHaveBeenCalledWith(currentPassword, testUserWithPassword.password)

    // Verify updateUserPassword was called with correct parameters
    expect(mockUpdateUserPassword).toHaveBeenCalledWith(
      testUserWithPassword.email,
      newPassword,
      testOptions
    )

    // Verify response structure
    expect(response).toBeDefined()
    expect(response.message).toBe('Password updated successfully')
  })
})
