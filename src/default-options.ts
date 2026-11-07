import type { ModuleOptions } from './types'

export const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/users.sqlite3',
    },
  },
  apiBasePath: '/api/nuxt-users',
  tables: {
    migrations: 'migrations',
    users: 'users',
    personalAccessTokens: 'personal_access_tokens',
    passwordResetTokens: 'password_reset_tokens',
  },
  mailer: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'user@ethereal.email',
      pass: 'password',
    },
    defaults: {
      from: '"Nuxt Users Module" <noreply@example.com>',
    },
  },
  // Empty by default so NUXT_NUXT_USERS_SITE_URL can override it (Nuxt only applies env vars to existing keys);
  // empty falls back to the request host in development and is rejected in production
  siteUrl: '',
  passwordResetUrl: '/reset-password',
  emailConfirmationUrl: '/email-confirmation',
  auth: {
    whitelist: [],
    tokenExpiration: 24 * 60,
    rememberMeExpiration: 30,
    permissions: {},
    allowCustomRoles: false,
  },
  passwordValidation: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
  },
  hardDelete: false,
  locale: {
    default: 'en',
    fallbackLocale: 'en',
    texts: {}
  },
  tokenCleanupSchedule: '0 2 * * *',
  theme: {
    enabled: true
  }
}
