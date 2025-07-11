export interface ModuleOptions {
  connector?: {
    name: 'sqlite' | 'mysql' | 'postgresql'
    options: {
      path?: string
      host?: string
      port?: number
      username?: string
      password?: string
      database?: string
    }
  }
  tables: {
    users: boolean
    personalAccessTokens: boolean
    passwordResetTokens?: boolean // Added for the new table
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
