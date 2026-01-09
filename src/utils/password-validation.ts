export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
  score: number // 0-100
  hints: string[]
}

export interface PasswordValidationOptions {
  minLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumbers?: boolean
  requireSpecialChars?: boolean
  preventCommonPasswords?: boolean
}

const DEFAULT_OPTIONS: Required<PasswordValidationOptions> = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true
}

/**
 * Get password validation options from module configuration
 */
export const getPasswordValidationOptions = (moduleOptions?: { passwordValidation?: PasswordValidationOptions }): PasswordValidationOptions => {
  if (!moduleOptions?.passwordValidation) {
    return DEFAULT_OPTIONS
  }

  return {
    ...DEFAULT_OPTIONS,
    ...moduleOptions.passwordValidation
  }
}

// Common weak passwords to prevent
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'hello',
  'freedom', 'whatever', 'qazwsx', 'trustno1', 'jordan', 'harley',
  'ranger', 'buster', 'thomas', 'tigger', 'robert', 'soccer', 'batman',
  'test', 'pass', 'user', 'guest', 'login', 'secret', 'god', 'love',
  'sex', 'money', 'password1', '12345678', 'qwerty123', 'admin123',
  'password!', 'password1!', 'password123', 'password123!'
]

export const validatePassword = (
  password: string,
  options: PasswordValidationOptions = {}
): PasswordValidationResult => {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const errors: string[] = []
  const hints: string[] = []
  let score = 0

  // Check minimum length
  if (password.length < config.minLength) {
    errors.push(`passwordStrength.errors.minLength|${config.minLength}`)
    hints.push(`passwordStrength.hints.minLength|${config.minLength}`)
  }
  if (password.length >= config.minLength) {
    score += 20
    if (password.length < 12) {
      hints.push('passwordStrength.hints.length12')
    }
  }

  // Check for uppercase letters
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('passwordStrength.errors.uppercase')
    hints.push('passwordStrength.hints.uppercase')
  }
  if (/[A-Z]/.test(password)) {
    score += 15
  }

  // Check for lowercase letters
  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('passwordStrength.errors.lowercase')
    hints.push('passwordStrength.hints.lowercase')
  }
  if (/[a-z]/.test(password)) {
    score += 15
  }

  // Check for numbers
  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('passwordStrength.errors.numbers')
    hints.push('passwordStrength.hints.numbers')
  }
  if (/\d/.test(password)) {
    score += 15
  }

  // Check for special characters
  if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('passwordStrength.errors.specialChars')
    hints.push('passwordStrength.hints.specialChars')
  }
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 15
  }

  // Check for common passwords
  if (config.preventCommonPasswords && COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('passwordStrength.errors.common')
    hints.push('passwordStrength.hints.common')
  }

  // Length bonus
  if (password.length >= 12) {
    score += 10
  }
  if (password.length >= 10 && password.length < 12) {
    score += 5
  }

  // Complexity bonus (multiple character types)
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

  const complexityTypes = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length
  if (complexityTypes >= 4) {
    score += 10
  }
  if (complexityTypes >= 3 && complexityTypes < 4) {
    score += 5
    hints.push('passwordStrength.hints.mix')
  }

  // Determine strength level
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (score >= 80) {
    strength = 'strong'
  }
  if (score >= 60 && score < 80) {
    strength = 'medium'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.min(score, 100),
    hints: Array.from(new Set(hints)) // deduplicate
  }
}

export const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak':
      return '#dc3545'
    case 'medium':
      return '#ffc107'
    case 'strong':
      return '#28a745'
    default:
      return '#6c757d'
  }
}

export const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong'): string => {
  switch (strength) {
    case 'weak':
      return 'Weak'
    case 'medium':
      return 'Medium'
    case 'strong':
      return 'Strong'
    default:
      return 'Unknown'
  }
}
