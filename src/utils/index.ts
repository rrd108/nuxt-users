export { validatePassword, getPasswordValidationOptions, getPasswordStrengthColor, getPasswordStrengthText, type PasswordValidationResult, type PasswordValidationOptions } from './password-validation'

// Export types for consumers
export type {
  User,
  UserWithoutPassword,
  PersonalAccessToken,
  PasswordResetToken,
  LoginFormData,
  ModuleOptions
} from '../types'

// Export server utilities for consumers (server-side only)
export { getLastLoginTime, findUserByEmail, getCurrentUserFromToken } from '../runtime/server/utils/user'
