export { validatePassword, getPasswordValidationOptions, getPasswordStrengthColor, getPasswordStrengthText, type PasswordValidationResult, type PasswordValidationOptions } from './password-validation'

// Export locale utilities
export { defaultLocaleMessages, en, hu, huFormal } from '../runtime/locales'
export { getTranslation, deepMerge, getNestedValue } from '../runtime/utils/locale'

// Export types and constants for consumers
export type {
  User,
  UserWithoutPassword,
  PersonalAccessToken,
  PasswordResetToken,
  LoginFormData,
  ModuleOptions,
  RuntimeModuleOptions,
  DisplayFieldsProps,
  LoginFormProps,
  ResetPasswordFormProps,
  Permission,
  DatabaseType,
  DatabaseConfig,
  GoogleOAuthOptions,
  LocaleOptions,
  LocaleMessages
} from '../types'

export { defaultDisplayFields, defaultFieldLabels } from '../types'
