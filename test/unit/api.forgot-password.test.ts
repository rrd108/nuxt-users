import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ModuleOptions } from '../../src/types'
import type { H3Event } from 'h3'
import { defaultOptions } from '../../src/module'

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn()
}))

vi.mock('h3', () => ({
  defineEventHandler: vi.fn(handler => handler),
  readBody: vi.fn(),
  createError: vi.fn(),
  getHeader: vi.fn()
}))

vi.mock('../../src/runtime/server/services/password', () => ({
  sendPasswordResetLink: vi.fn()
}))

// Import the forgot-password api endpoint after mocking
const forgotPasswordApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/password/forgot.post')

describe('Forgot Password API Route', () => {
  let testOptions: ModuleOptions
  let mockEvent: H3Event
  let mockReadBody: ReturnType<typeof vi.fn>
  let mockCreateError: ReturnType<typeof vi.fn>
  let mockGetHeader: ReturnType<typeof vi.fn>
  let mockDefineEventHandler: ReturnType<typeof vi.fn>
  let mockUseRuntimeConfig: ReturnType<typeof vi.fn>
  let mockSendPasswordResetLink: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked functions
    const h3 = await import('h3')
    const imports = await import('#imports')
    const passwordService = await import('../../src/runtime/server/services/password')

    mockReadBody = h3.readBody as ReturnType<typeof vi.fn>
    mockCreateError = h3.createError as ReturnType<typeof vi.fn>
    mockGetHeader = h3.getHeader as ReturnType<typeof vi.fn>
    mockDefineEventHandler = h3.defineEventHandler as ReturnType<typeof vi.fn>
    mockUseRuntimeConfig = imports.useRuntimeConfig as ReturnType<typeof vi.fn>
    mockSendPasswordResetLink = passwordService.sendPasswordResetLink as ReturnType<typeof vi.fn>

    // Mock test options
    testOptions = {
      ...defaultOptions,
      passwordResetUrl: '/reset-password'
    }

    // Mock runtime config
    mockUseRuntimeConfig.mockReturnValue({
      nuxtUsers: testOptions
    })

    // Mock getHeader to return default values
    mockGetHeader.mockImplementation((event, headerName) => {
      if (headerName === 'host') return 'localhost:3000'
      if (headerName === 'x-forwarded-proto') return null
      return null
    })

    // Create mock event
    mockEvent = {
      context: {
        nuxtUsers: testOptions
      }
    } as unknown as H3Event

    // Mock defineEventHandler to return the handler function
    mockDefineEventHandler.mockImplementation(handler => handler)
  })

  afterEach(async () => {
    vi.clearAllMocks()
  })

  it('should return success message when valid email is provided', async () => {
    const validEmail = 'test@example.com'

    // Mock readBody to return valid email
    mockReadBody.mockResolvedValue({ email: validEmail })

    // Mock sendPasswordResetLink to succeed
    mockSendPasswordResetLink.mockResolvedValue(undefined)

    // Call the handler directly
    const response = await forgotPasswordApiEndpoint.default(mockEvent)

    // Verify readBody was called correctly
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)

    // Verify sendPasswordResetLink was called with correct parameters (including baseUrl)
    expect(mockSendPasswordResetLink).toHaveBeenCalledWith(validEmail, testOptions, 'http://localhost:3000')

    // Verify response structure
    expect(response).toBeDefined()
    expect(response.message).toBe('If a user with that email exists, a password reset link has been sent.')
  })

  it('should return 400 when email is missing', async () => {
    // Mock readBody to return empty object
    mockReadBody.mockResolvedValue({})

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await forgotPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(400)
      expect(h3Error.statusMessage).toBe('Email is required and must be a string.')
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Email is required and must be a string.'
    })
  })

  it('should return 400 when email is not a string', async () => {
    // Mock readBody to return email as number
    mockReadBody.mockResolvedValue({ email: 123 })

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await forgotPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(400)
      expect(h3Error.statusMessage).toBe('Email is required and must be a string.')
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Email is required and must be a string.'
    })
  })

  it('should return 400 when email is empty string', async () => {
    // Mock readBody to return empty email
    mockReadBody.mockResolvedValue({ email: '' })

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await forgotPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(400)
      expect(h3Error.statusMessage).toBe('Email is required and must be a string.')
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Email is required and must be a string.'
    })
  })

  it('should return 400 when email is null', async () => {
    // Mock readBody to return null email
    mockReadBody.mockResolvedValue({ email: null })

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await forgotPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(400)
      expect(h3Error.statusMessage).toBe('Email is required and must be a string.')
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Email is required and must be a string.'
    })
  })

  it('should return 500 when sendPasswordResetLink throws an error', async () => {
    const validEmail = 'test@example.com'

    // Mock readBody to return valid email
    mockReadBody.mockResolvedValue({ email: validEmail })

    // Mock sendPasswordResetLink to throw an error
    const mockError = new Error('Database connection failed')
    mockSendPasswordResetLink.mockRejectedValue(mockError)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await forgotPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(500)
      expect(h3Error.statusMessage).toBe('An internal server error occurred.')
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockSendPasswordResetLink).toHaveBeenCalledWith(validEmail, testOptions, 'http://localhost:3000')
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 500,
      statusMessage: 'An internal server error occurred.'
    })
  })

  it('should return 500 when sendPasswordResetLink throws non-Error object', async () => {
    const validEmail = 'test@example.com'

    // Mock readBody to return valid email
    mockReadBody.mockResolvedValue({ email: validEmail })

    // Mock sendPasswordResetLink to throw a non-Error object
    mockSendPasswordResetLink.mockRejectedValue('Some string error')

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await forgotPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(500)
      expect(h3Error.statusMessage).toBe('An internal server error occurred.')
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockSendPasswordResetLink).toHaveBeenCalledWith(validEmail, testOptions, 'http://localhost:3000')
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 500,
      statusMessage: 'An internal server error occurred.'
    })
  })

  it('should handle email with special characters', async () => {
    const specialEmail = 'test+tag@example.com'

    // Mock readBody to return email with special characters
    mockReadBody.mockResolvedValue({ email: specialEmail })

    // Mock sendPasswordResetLink to succeed
    mockSendPasswordResetLink.mockResolvedValue(undefined)

    // Call the handler directly
    const response = await forgotPasswordApiEndpoint.default(mockEvent)

    // Verify readBody was called correctly
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)

    // Verify sendPasswordResetLink was called with correct parameters
    expect(mockSendPasswordResetLink).toHaveBeenCalledWith(specialEmail, testOptions, 'http://localhost:3000')

    // Verify response structure
    expect(response).toBeDefined()
    expect(response.message).toBe('If a user with that email exists, a password reset link has been sent.')
  })

  it('should handle long email addresses', async () => {
    const longEmail = 'very.long.email.address.with.many.subdomains@very.long.domain.example.com'

    // Mock readBody to return long email
    mockReadBody.mockResolvedValue({ email: longEmail })

    // Mock sendPasswordResetLink to succeed
    mockSendPasswordResetLink.mockResolvedValue(undefined)

    // Call the handler directly
    const response = await forgotPasswordApiEndpoint.default(mockEvent)

    // Verify readBody was called correctly
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)

    // Verify sendPasswordResetLink was called with correct parameters
    expect(mockSendPasswordResetLink).toHaveBeenCalledWith(longEmail, testOptions, 'http://localhost:3000')

    // Verify response structure
    expect(response).toBeDefined()
    expect(response.message).toBe('If a user with that email exists, a password reset link has been sent.')
  })
})
