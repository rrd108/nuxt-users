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

export interface LocaleMessages {
  [key: string]: string | LocaleMessages
}

export interface LocaleOptions {
  /**
   * Default locale code
   * @default 'en'
   */
  default?: string
  /**
   * Custom messages to override or extend default translations
   * Use nested object structure for organizing translations
   * @example
   * {
   *   en: {
   *     login: { title: 'Welcome', submit: 'Sign In' }
   *   },
   *   hu: {
   *     login: { title: 'Üdvözöljük', submit: 'Bejelentkezés' }
   *   }
   * }
   */
  texts?: Record<string, LocaleMessages>
  /**
   * Fallback locale when translation is missing
   * @default 'en'
   */
  fallbackLocale?: string
}
export interface GoogleOAuthOptions {
  /**
   * Google OAuth client ID from Google Cloud Console
   */
  clientId: string
  /**
   * Google OAuth client secret from Google Cloud Console
   */
  clientSecret: string
  /**
   * Callback URL for Google OAuth (must match what's configured in Google Cloud Console)
   * @default '/api/nuxt-users/auth/google/callback'
   */
  callbackUrl?: string
  /**
   * Redirect URL after successful authentication
   * @default '/'
   */
  successRedirect?: string
  /**
   * Redirect URL after failed authentication
   * @default '/login?error=oauth_failed'
   */
  errorRedirect?: string
  /**
   * Google OAuth scopes to request
   * @default ['openid', 'profile', 'email']
   */
  scopes?: string[]
  /**
   * Allow automatic user registration when logging in with Google for the first time
   * If false, only existing users with matching email can log in with Google
   * @default false
   */
  allowAutoRegistration?: boolean
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
   * URL path for password reset page
   * @default '/reset-password'
   */
  passwordResetUrl?: string
  /**
   * URL to redirect to after email confirmation (success or failure)
   * Query parameters will be added: ?status=success|error&message=...
   * @default '/login'
   */
  emailConfirmationUrl?: string
  /**
   * Skip database checks during module setup to prevent hanging
   * @default false
   */
  auth?: {
    /**
     * Whitelisted routes that do not require authentication
     * @default ['/login']
     * @example ['/register']
     */
    whitelist?: string[]
    /**
     * Token expiration time in minutes
     * @default 1440
     */
    tokenExpiration?: number
    /**
     * Remember me token expiration time in days
     * @default 30
     */
    rememberMeExpiration?: number
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
    /**
     * Google OAuth configuration
     * Enable Google OAuth login/registration
     */
    google?: GoogleOAuthOptions
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
  /**
   * Enable hard delete for user deletion
   * When false (default), users are soft deleted (active set to false)
   * When true, users are permanently deleted from database
   * @default false
   */
  hardDelete?: boolean
  /**
   * Locale configuration for component labels and messages
   */
  locale?: LocaleOptions
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
  passwordResetUrl: string
  emailConfirmationUrl: string
  auth: {
    whitelist: string[]
    tokenExpiration: number
    rememberMeExpiration: number
    permissions: Record<string, (string | Permission)[]>
    google?: GoogleOAuthOptions
  }
  passwordValidation: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    preventCommonPasswords: boolean
  }
  hardDelete: boolean
  locale?: {
    default: string
    fallbackLocale?: string
    texts?: Record<string, LocaleMessages>
  }
  /**
   * Token cleanup schedule (cron expression)
   * Set to null or false to disable automatic cleanup
   * Default: '0 2 * * *' (daily at 2 AM)
   */
  tokenCleanupSchedule?: string | false | null
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
  google_id?: string
  profile_picture?: string
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
  resetPasswordEndpoint?: string
  redirectTo?: string
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
