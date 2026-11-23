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

export interface PasskeyOptions {
  /**
   * Relying party ID: the domain passkeys are bound to (e.g. 'example.com', no scheme or port).
   * Defaults to the host of `siteUrl`; required in production (directly or via siteUrl), 'localhost' in development.
   */
  rpId?: string
  /**
   * Relying party display name shown by the authenticator
   * @default 'Nuxt Users'
   */
  rpName?: string
  /**
   * Allowed origins for WebAuthn ceremonies (e.g. ['https://example.com']).
   * Also accepts a single string or a comma-separated list, so an environment variable can set it
   * (NUXT_NUXT_USERS_AUTH_PASSKEY_ORIGINS=https://example.com).
   * Defaults to the origin of `siteUrl` when empty; required in production (directly or via siteUrl),
   * and ['http://localhost:3000'] in development.
   */
  origins?: string[] | string
  /**
   * User verification requirement for passkey ceremonies
   * @default 'preferred'
   */
  userVerification?: 'required' | 'preferred' | 'discouraged'
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
    /** Passkey (WebAuthn) credentials table, used when auth.passkey is enabled */
    passkeys?: string
    /** Short-lived passkey ceremony challenges table, used when auth.passkey is enabled */
    passkeyChallenges?: string
  }
  /**
   * Mailer configuration options for sending emails (e.g., password resets)
   * Uses nodemailer
   */
  mailer?: MailerOptions

  /**
   * Public base URL of the app (e.g. 'https://example.com'), used to build links in emails
   * (password reset, email confirmation). Required in production: the request Host header
   * is attacker-controlled and is only used as a fallback in development.
   */
  siteUrl?: string
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
     * Allow assigning roles that are not defined in auth.permissions
     * When false (default), create/update user role must be a key of permissions
     * (or any role if permissions is empty / not yet configured)
     * @default false
     */
    allowCustomRoles?: boolean
    /**
     * Google OAuth configuration
     * Enable Google OAuth login/registration
     */
    google?: GoogleOAuthOptions
    /**
     * Passkey (WebAuthn) login configuration. Passkeys are off unless this is set.
     */
    passkey?: PasskeyOptions
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
   * Run the module's database migrations automatically when the server starts.
   * Set to false to run them yourself, with `npx nuxt-users migrate` or `runMigrations()`.
   * When true, the Nitro runtime hook `nuxt-users:migrated` fires once the run finishes.
   * @default true
   */
  autoMigrate?: boolean
  /**
   * Locale configuration for component labels and messages
   */
  locale?: LocaleOptions
  /**
   * Theme configuration for color scheme management
   */
  theme?: {
    /**
     * Enable the automatic theme plugin
     * When disabled, the module won't manage themes automatically,
     * allowing consumer apps full control over theme management
     * @default true
     */
    enabled?: boolean
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
    passkeys: string
    passkeyChallenges: string
  }
  mailer?: MailerOptions
  siteUrl?: string
  passwordResetUrl: string
  emailConfirmationUrl: string
  auth: {
    whitelist: string[]
    tokenExpiration: number
    rememberMeExpiration: number
    permissions: Record<string, (string | Permission)[]>
    /**
     * Allow assigning roles that are not defined in auth.permissions
     * @default false
     */
    allowCustomRoles: boolean
    google?: GoogleOAuthOptions
    passkey?: PasskeyOptions
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
  /**
   * Run the module's database migrations automatically when the server starts
   * @default true
   */
  autoMigrate?: boolean
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
  /**
   * Theme configuration for color scheme management
   */
  theme?: {
    /**
     * Enable the automatic theme plugin
     * When disabled, the module won't manage themes automatically,
     * allowing consumer apps full control over theme management
     * @default true
     */
    enabled?: boolean
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

/** A passkey as the API shows it: no key material, credential id or user handle */
export interface PasskeySummary {
  id: number
  name: string
  device_type: string
  backed_up: boolean
  transports: string[]
  created_at: string
  last_used_at: string | null
}

/**
 * The passkeys a user still has, in the shape of the WebAuthn Signal API's `signalAllAcceptCredentials`:
 * authenticators drop the user's other passkeys for the relying party. `userId` is the base64url user handle.
 */
export interface PasskeyAcceptedCredentials {
  rpId: string
  userId: string
  allAcceptedCredentialIds: string[]
}

/** The `data` of the 401 a passkey login gets for a credential the server does not know (it was removed) */
export interface PasskeyUnknownCredential {
  code: 'unknown_credential'
  rpId: string
  credentialId: string
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

/**
 * Payload of the `nuxt-users:migrated` Nitro runtime hook, called when the startup migration run finishes
 */
export interface NuxtUsersMigratedContext {
  /** Names of the migrations applied by this run (empty if none were pending, or on failure) */
  applied: string[]
  /** Set when the run failed. The failed migration was not recorded and runs again on the next start. */
  error?: unknown
}
