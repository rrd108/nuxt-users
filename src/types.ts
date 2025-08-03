export type DatabaseType = 'sqlite' | 'mysql' | 'postgresql'

export type DatabaseConfig = {
  path?: string
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
}
export interface RuntimeModuleOptions {
  connector?: {
    name: DatabaseType
    options: DatabaseConfig
  }
  tables?: {
    migrations?: string
    users?: string
    personalAccessTokens?: string
    passwordResetTokens?: string
  }
  /**
   * Mailer configuration options for sending emails (e.g., password resets)
   * Uses nodemailer
   */
  mailer?: MailerOptions

  /**
   * Base URL for password reset links
   * @default 'http://localhost:3000' // Example, will be set in module defaults
   */
  passwordResetBaseUrl?: string
  /**
   * Skip database checks during module setup to prevent hanging
   * @default false
   */
  auth?: {
    /**
     * Whitelisted routes that do not require authentication
     * @default ['/login']
     * @example ['/login', '/register']
     */
    whitelist?: string[]
    /**
     * Token expiration time in minutes
     * @default 1440
     */
    tokenExpiration?: number
    /**
     * Role-based permissions configuration
     * @default {}
     * @example {
     *   admin: ['*'], // admin can access everything
     *   user: ['/profile', '/api/user/profile'],
     *   moderator: ['/admin/*', '/api/admin/*']
     * }
     */
    permissions?: Record<string, string[]>
  }
  /**
   * Password validation configuration
   */
  passwordValidation?: {
    /**
     * Minimum password length
     * @default 8
     */
    minLength?: number
    /**
     * Require uppercase letters
     * @default true
     */
    requireUppercase?: boolean
    /**
     * Require lowercase letters
     * @default true
     */
    requireLowercase?: boolean
    /**
     * Require numbers
     * @default true
     */
    requireNumbers?: boolean
    /**
     * Require special characters
     * @default true
     */
    requireSpecialChars?: boolean
    /**
     * Prevent common passwords
     * @default true
     */
    preventCommonPasswords?: boolean
  }
}

// Runtime config type with all properties required (after merging with defaults)
export interface ModuleOptions {
  connector: {
    name: DatabaseType
    options: DatabaseConfig
  }
  tables: {
    migrations: string
    users: string
    personalAccessTokens: string
    passwordResetTokens: string
  }
  mailer?: MailerOptions
  passwordResetBaseUrl?: string
  auth: {
    whitelist: string[]
    tokenExpiration: number
    permissions: Record<string, string[]>
  }
  passwordValidation: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    preventCommonPasswords: boolean
  }
}

export interface MailerOptions {
  host: string
  port: number
  secure?: boolean // true for 465, false for other ports
  auth: {
    user: string // email user
    pass: string // email password
  }
  defaults?: {
    from: string // Default from address: '"Your App Name" <yourapp@example.com>'
  }
}

export interface User {
  id: number
  email: string
  name: string
  password: string
  role: string
  created_at: string
  updated_at: string
}

export type UserWithoutPassword = Omit<User, 'password'>

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginFormProps {
  apiEndpoint?: string
  redirectTo?: string
  forgotPasswordEndpoint?: string
}

export interface LogoutLinkProps {
  redirectTo?: string
  linkText?: string
  confirmMessage?: string
  class?: string
}

export interface ResetPasswordFormProps {
  apiEndpoint?: string
  updatePasswordEndpoint?: string
}
