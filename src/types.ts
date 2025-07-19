export type DatabaseType = 'sqlite' | 'mysql' | 'postgresql'

export type DatabaseConfig = {
  path?: string
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
  // MySQL specific options
  connectTimeout?: number
  acquireTimeout?: number
  // PostgreSQL specific options
  connectionTimeoutMillis?: number
}
export interface ModuleOptions {
  connector?: {
    name: DatabaseType
    options: DatabaseConfig
  }
  tables: {
    users: string
    personalAccessTokens: string
    passwordResetTokens: string
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
  skipDatabaseChecks?: boolean
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
  created_at: string
  updated_at: string
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginFormProps {
  apiEndpoint?: string
  redirectTo?: string
}
