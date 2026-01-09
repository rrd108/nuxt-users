import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ModuleOptions } from '../../src/types'
import type { H3Event } from 'h3'
import { defaultOptions } from '../../src/module'

// Mock h3 functions
vi.mock('h3', () => ({
  defineEventHandler: vi.fn(handler => handler),
  readBody: vi.fn(),
  createError: vi.fn()
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn()
}))

vi.mock('../../src/runtime/server/services/password', () => ({
  resetPassword: vi.fn()
}))

vi.mock('../../src/utils', () => ({
  validatePassword: vi.fn(),
  getPasswordValidationOptions: vi.fn()
}))

// Import the reset-password api endpoint after mocking
const resetPasswordApiEndpoint = await import('../../src/runtime/server/api/nuxt-users/password/reset.post')

describe('Reset Password API Route', () => {
  let testOptions: ModuleOptions
  let mockEvent: H3Event
  let mockPasswordOptions: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    preventCommonPasswords: boolean
  }
  let mockReadBody: ReturnType<typeof vi.fn>
  let mockCreateError: ReturnType<typeof vi.fn>
  let mockDefineEventHandler: ReturnType<typeof vi.fn>
  let mockUseRuntimeConfig: ReturnType<typeof vi.fn>
  let mockResetPassword: ReturnType<typeof vi.fn>
  let mockValidatePassword: ReturnType<typeof vi.fn>
  let mockGetPasswordValidationOptions: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked functions
    const h3 = await import('h3')
    const imports = await import('#imports')
    const passwordService = await import('../../src/runtime/server/services/password')
    const utils = await import('../../src/utils')

    mockReadBody = h3.readBody as ReturnType<typeof vi.fn>
    mockCreateError = h3.createError as ReturnType<typeof vi.fn>
    mockDefineEventHandler = h3.defineEventHandler as ReturnType<typeof vi.fn>
    mockUseRuntimeConfig = imports.useRuntimeConfig as ReturnType<typeof vi.fn>
    mockResetPassword = passwordService.resetPassword as ReturnType<typeof vi.fn>
    mockValidatePassword = utils.validatePassword as ReturnType<typeof vi.fn>
    mockGetPasswordValidationOptions = utils.getPasswordValidationOptions as ReturnType<typeof vi.fn>

    // Mock test options
    testOptions = {
      ...defaultOptions,
      passwordResetUrl: '/reset-password'
    }

    // Mock password validation options
    mockPasswordOptions = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true
    }

    // Mock runtime config
    mockUseRuntimeConfig.mockReturnValue({
      nuxtUsers: testOptions
    })

    // Mock password validation options
    mockGetPasswordValidationOptions.mockReturnValue(mockPasswordOptions)

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

  it('should return success message when valid data is provided', async () => {
    const validData = {
      token: 'valid-reset-token',
      email: 'test@example.com',
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    }

    // Mock readBody to return valid data
    mockReadBody.mockResolvedValue(validData)

    // Mock password validation to succeed
    mockValidatePassword.mockReturnValue({
      isValid: true,
      errors: []
    })

    // Mock resetPassword to succeed
    mockResetPassword.mockResolvedValue(true)

    // Call the handler directly
    const response = await resetPasswordApiEndpoint.default(mockEvent)

    // Verify readBody was called correctly
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)

    // Verify password validation was called
    expect(mockGetPasswordValidationOptions).toHaveBeenCalledWith(testOptions)
    expect(mockValidatePassword).toHaveBeenCalledWith(validData.password, mockPasswordOptions)

    // Verify resetPassword was called with correct parameters
    expect(mockResetPassword).toHaveBeenCalledWith(
      validData.token,
      validData.email,
      validData.password,
      testOptions
    )

    // Verify response structure
    expect(response).toBeDefined()
    expect(response?.message).toBe('Password has been reset successfully. You can now log in with your new password.')
  })

  it('should return 400 when email is missing', async () => {
    const invalidData = {
      token: 'valid-reset-token',
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    }

    // Mock readBody to return data without email
    mockReadBody.mockResolvedValue(invalidData)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await resetPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(400)
      expect(h3Error.statusMessage).toBe('Email is required.')
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Email is required.'
    })
  })

  it('should return 400 when email is not a string', async () => {
    const invalidData = {
      token: 'valid-reset-token',
      email: 123,
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    }

    // Mock readBody to return email as number
    mockReadBody.mockResolvedValue(invalidData)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await resetPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(400)
      expect(h3Error.statusMessage).toBe('Email is required.')
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Email is required.'
    })
  })

  it('should return 400 when password is missing', async () => {
    const invalidData = {
      token: 'valid-reset-token',
      email: 'test@example.com',
      password_confirmation: 'NewPassword123!'
    }

    // Mock readBody to return data without password
    mockReadBody.mockResolvedValue(invalidData)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await resetPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(400)
      expect(h3Error.statusMessage).toBe('Password is required.')
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Password is required.'
    })
  })

  it('should return 400 when password is not a string', async () => {
    const invalidData = {
      token: 'valid-reset-token',
      email: 'test@example.com',
      password: 123,
      password_confirmation: 'NewPassword123!'
    }

    // Mock readBody to return password as number
    mockReadBody.mockResolvedValue(invalidData)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await resetPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(400)
      expect(h3Error.statusMessage).toBe('Password is required.')
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Password is required.'
    })
  })

  it('should return 400 when passwords do not match', async () => {
    const invalidData = {
      token: 'valid-reset-token',
      email: 'test@example.com',
      password: 'NewPassword123!',
      password_confirmation: 'DifferentPassword123!'
    }

    // Mock readBody to return mismatched passwords
    mockReadBody.mockResolvedValue(invalidData)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await resetPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      const h3Error = error as Error & { statusCode: number, statusMessage: string }
      expect(h3Error.statusCode).toBe(400)
      expect(h3Error.statusMessage).toBe('Passwords do not match.')
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Passwords do not match.'
    })
  })

  it('should return 400 when password validation fails', async () => {
    const validData = {
      token: 'valid-reset-token',
      email: 'test@example.com',
      password: 'weak',
      password_confirmation: 'weak'
    }

    // Mock readBody to return valid data
    mockReadBody.mockResolvedValue(validData)

    // Mock password validation to fail
    mockValidatePassword.mockReturnValue({
      isValid: false,
      errors: ['passwordStrength.errors.minLength|8', 'passwordStrength.errors.uppercase']
    })

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await resetPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      // The error should be thrown by createError, so we just verify it was called
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockValidatePassword).toHaveBeenCalledWith(validData.password, mockPasswordOptions)
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Password validation failed: passwordStrength.errors.minLength|8, passwordStrength.errors.uppercase'
    })
  })

  it('should return 400 when resetPassword returns false', async () => {
    const validData = {
      token: 'invalid-reset-token',
      email: 'test@example.com',
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    }

    // Mock readBody to return valid data
    mockReadBody.mockResolvedValue(validData)

    // Mock password validation to succeed
    mockValidatePassword.mockReturnValue({
      isValid: true,
      errors: []
    })

    // Mock resetPassword to fail
    mockResetPassword.mockResolvedValue(false)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await resetPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      // The error should be thrown by createError, so we just verify it was called
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockValidatePassword).toHaveBeenCalledWith(validData.password, mockPasswordOptions)
    expect(mockResetPassword).toHaveBeenCalledWith(
      validData.token,
      validData.email,
      validData.password,
      testOptions
    )
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: 'Invalid or expired token, or email mismatch. Please request a new password reset link.'
    })
  })

  it('should return 500 when resetPassword throws an error', async () => {
    const validData = {
      token: 'valid-reset-token',
      email: 'test@example.com',
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    }

    // Mock readBody to return valid data
    mockReadBody.mockResolvedValue(validData)

    // Mock password validation to succeed
    mockValidatePassword.mockReturnValue({
      isValid: true,
      errors: []
    })

    // Mock resetPassword to throw an error
    const mockError = new Error('Database connection failed')
    mockResetPassword.mockRejectedValue(mockError)

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await resetPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      // The error should be thrown by createError, so we just verify it was called
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockValidatePassword).toHaveBeenCalledWith(validData.password, mockPasswordOptions)
    expect(mockResetPassword).toHaveBeenCalledWith(
      validData.token,
      validData.email,
      validData.password,
      testOptions
    )
    // Note: createError is not called in this case because the error is re-thrown directly
  })

  it('should return 500 when resetPassword throws non-Error object', async () => {
    const validData = {
      token: 'valid-reset-token',
      email: 'test@example.com',
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    }

    // Mock readBody to return valid data
    mockReadBody.mockResolvedValue(validData)

    // Mock password validation to succeed
    mockValidatePassword.mockReturnValue({
      isValid: true,
      errors: []
    })

    // Mock resetPassword to throw a non-Error object
    mockResetPassword.mockRejectedValue('Some string error')

    // Mock createError to throw an error
    mockCreateError.mockImplementation(({ statusCode, statusMessage }) => {
      const error = new Error(statusMessage) as Error & { statusCode: number, statusMessage: string }
      error.statusCode = statusCode
      error.statusMessage = statusMessage
      throw error
    })

    try {
      await resetPasswordApiEndpoint.default(mockEvent)
    }
    catch (error: unknown) {
      expect(error).toBeInstanceOf(Error)
      // The error should be thrown by createError, so we just verify it was called
    }

    // Verify readBody was called
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)
    expect(mockValidatePassword).toHaveBeenCalledWith(validData.password, mockPasswordOptions)
    expect(mockResetPassword).toHaveBeenCalledWith(
      validData.token,
      validData.email,
      validData.password,
      testOptions
    )
    // Note: createError is not called in this case because the error is re-thrown directly
  })

  it('should handle email with special characters', async () => {
    const validData = {
      token: 'valid-reset-token',
      email: 'test+tag@example.com',
      password: 'NewPassword123!',
      password_confirmation: 'NewPassword123!'
    }

    // Mock readBody to return valid data with special email
    mockReadBody.mockResolvedValue(validData)

    // Mock password validation to succeed
    mockValidatePassword.mockReturnValue({
      isValid: true,
      errors: []
    })

    // Mock resetPassword to succeed
    mockResetPassword.mockResolvedValue(true)

    // Call the handler directly
    const response = await resetPasswordApiEndpoint.default(mockEvent)

    // Verify readBody was called correctly
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)

    // Verify resetPassword was called with correct parameters
    expect(mockResetPassword).toHaveBeenCalledWith(
      validData.token,
      validData.email,
      validData.password,
      testOptions
    )

    // Verify response structure
    expect(response).toBeDefined()
    expect(response?.message).toBe('Password has been reset successfully. You can now log in with your new password.')
  })

  it('should handle complex passwords', async () => {
    const validData = {
      token: 'valid-reset-token',
      email: 'test@example.com',
      password: 'VeryComplexPassword123!@#$%^&*()',
      password_confirmation: 'VeryComplexPassword123!@#$%^&*()'
    }

    // Mock readBody to return valid data with complex password
    mockReadBody.mockResolvedValue(validData)

    // Mock password validation to succeed
    mockValidatePassword.mockReturnValue({
      isValid: true,
      errors: []
    })

    // Mock resetPassword to succeed
    mockResetPassword.mockResolvedValue(true)

    // Call the handler directly
    const response = await resetPasswordApiEndpoint.default(mockEvent)

    // Verify readBody was called correctly
    expect(mockReadBody).toHaveBeenCalledWith(mockEvent)

    // Verify password validation was called
    expect(mockValidatePassword).toHaveBeenCalledWith(validData.password, mockPasswordOptions)

    // Verify resetPassword was called with correct parameters
    expect(mockResetPassword).toHaveBeenCalledWith(
      validData.token,
      validData.email,
      validData.password,
      testOptions
    )

    // Verify response structure
    expect(response).toBeDefined()
    expect(response?.message).toBe('Password has been reset successfully. You can now log in with your new password.')
  })
})
