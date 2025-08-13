export type DatabaseType = 'sqlite' | 'mysql' | 'postgresql'

export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH'

export type Permission = string | {
  path: string
  methods: HttpMethod[]
}

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
  /**
   * Base path for all module API endpoints
   * @default '/api/nuxt-users'
   */
  apiBasePath?: string
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
     *   user: ['/profile', '/api/nuxt-users/me'],
     *   moderator: ['/admin/*', '/api/admin/*']
     * }
     */
    permissions?: Record<string, (string | Permission)[]>
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
  apiBasePath: string
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
    permissions: Record<string, (string | Permission)[]>
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
  active: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
}

export type UserWithoutPassword = Omit<User, 'password'>

export interface PersonalAccessToken {
  id: number
  tokenable_type: string
  tokenable_id: number
  name: string
  token: string
  abilities?: string
  last_used_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface PasswordResetToken {
  id: number
  email: string
  token: string
  created_at: string
}

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

export interface DisplayFieldsProps {
  displayFields?: string[]
  fieldLabels?: Record<string, string>
}

export const defaultDisplayFields = ['id', 'name', 'email', 'role', 'active', 'created_at', 'updated_at', 'last_login_at']

export const defaultFieldLabels = {
  id: 'ID',
  name: 'Name',
  email: 'Email',
  role: 'Role',
  active: 'Active',
  created_at: 'Created',
  updated_at: 'Updated',
  last_login_at: 'Last Login'
}
