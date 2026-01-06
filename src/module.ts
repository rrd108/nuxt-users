import { defineNuxtModule, createResolver, addServerHandler, addComponentsDir, addPlugin, addImportsDir, addRouteMiddleware, addServerImportsDir } from '@nuxt/kit'
import { defu } from 'defu'
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
  mailer: { // Added default mailer (example using ethereal.email)
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'user@ethereal.email', // Replace with actual Ethereal user
      pass: 'password', // Replace with actual Ethereal password
    },
    defaults: {
      from: '"Nuxt Users Module" <noreply@example.com>',
    },
  },
  passwordResetUrl: '/reset-password',
  emailConfirmationUrl: '/email-confirmation',
  auth: {
    whitelist: [],
    tokenExpiration: 24 * 60, // 24 hours in minutes
    rememberMeExpiration: 30, // 30 days
    permissions: {}, // Empty by default - whitelist approach
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
  tokenCleanupSchedule: '0 2 * * *' // Daily at 2 AM
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-users',
    configKey: 'nuxtUsers',
    compatibility: {
      nuxt: '>=3.0.0'
    }
  },
  // Default configuration options of the Nuxt module
  defaults: defaultOptions,

  async setup(options: ModuleOptions, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add runtime config (server-side)
    // Priority: runtimeConfig (strongest) > top-level app config > default options (weakest)
    // Exclude connector from defaults to prevent mixing MySQL/PostgreSQL with SQLite settings
    const { connector: _defaultConnector, ...defaultsWithoutConnector } = defaultOptions
    const runtimeConfigOptions = defu(nuxt.options.runtimeConfig.nuxtUsers || {}, options, defaultsWithoutConnector) as ModuleOptions

    // Ensure locale defaults are set (defu should handle this, but ensure it's present)
    if (!runtimeConfigOptions.locale) {
      runtimeConfigOptions.locale = defaultOptions.locale!
    }

    // Use the configured connector or fallback to default (don't merge connector options)
    const configuredConnector = (nuxt.options.runtimeConfig.nuxtUsers as unknown as ModuleOptions)?.connector || options.connector
    runtimeConfigOptions.connector = configuredConnector || defaultOptions.connector

    nuxt.options.runtimeConfig.nuxtUsers = {
      ...runtimeConfigOptions,
      auth: {
        tokenExpiration: runtimeConfigOptions.auth.tokenExpiration,
        rememberMeExpiration: runtimeConfigOptions.auth.rememberMeExpiration,
        permissions: runtimeConfigOptions.auth.permissions,
        ...(runtimeConfigOptions.auth.google && { google: runtimeConfigOptions.auth.google }),
        whitelist: (() => {
          const combinedWhitelist = [...(defaultOptions.auth?.whitelist || []), ...(runtimeConfigOptions.auth?.whitelist || [])]
          const apiBasePath = runtimeConfigOptions.apiBasePath || defaultOptions.apiBasePath

          // Auto-whitelist related endpoints if /register is whitelisted
          if (combinedWhitelist.includes('/register')) {
            const registrationEndpoints = [
              '/confirm-email', // Page route for email confirmation
              `${apiBasePath}/register`, // API endpoint for registration
              `${apiBasePath}/confirm-email` // API endpoint for email confirmation
            ]

            registrationEndpoints.forEach((endpoint) => {
              if (!combinedWhitelist.includes(endpoint)) {
                combinedWhitelist.push(endpoint)
              }
            })
          }

          // Auto-whitelist Google OAuth endpoints if Google OAuth is configured
          if (runtimeConfigOptions.auth?.google) {
            const googleOAuthEndpoints = [
              `${apiBasePath}/auth/google/redirect`,
              `${apiBasePath}/auth/google/callback`
            ]

            googleOAuthEndpoints.forEach((endpoint) => {
              if (!combinedWhitelist.includes(endpoint)) {
                combinedWhitelist.push(endpoint)
              }
            })
          }

          return combinedWhitelist
        })()
      },
    } as unknown as typeof nuxt.options.runtimeConfig.nuxtUsers

    // Add public runtime config for client-side access
    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {}
    nuxt.options.runtimeConfig.public.nuxtUsers = {
      passwordValidation: runtimeConfigOptions.passwordValidation,
      locale: runtimeConfigOptions.locale,
      auth: {
        whitelist: (() => {
          const combinedWhitelist = [...(defaultOptions.auth?.whitelist || []), ...(runtimeConfigOptions.auth?.whitelist || [])]
          const apiBasePath = runtimeConfigOptions.apiBasePath || defaultOptions.apiBasePath

          // Auto-whitelist related endpoints if /register is whitelisted
          if (combinedWhitelist.includes('/register')) {
            const registrationEndpoints = [
              '/confirm-email', // Page route for email confirmation
              `${apiBasePath}/register`, // API endpoint for registration
              `${apiBasePath}/confirm-email` // API endpoint for email confirmation
            ]

            registrationEndpoints.forEach((endpoint) => {
              if (!combinedWhitelist.includes(endpoint)) {
                combinedWhitelist.push(endpoint)
              }
            })
          }

          // Auto-whitelist Google OAuth endpoints if Google OAuth is configured
          if (runtimeConfigOptions.auth?.google) {
            const googleOAuthEndpoints = [
              `${apiBasePath}/auth/google/redirect`,
              `${apiBasePath}/auth/google/callback`
            ]

            googleOAuthEndpoints.forEach((endpoint) => {
              if (!combinedWhitelist.includes(endpoint)) {
                combinedWhitelist.push(endpoint)
              }
            })
          }

          return combinedWhitelist
        })(),
        permissions: runtimeConfigOptions.auth?.permissions || defaultOptions.auth.permissions
      },
      apiBasePath: runtimeConfigOptions.apiBasePath || defaultOptions.apiBasePath
    } as unknown as typeof nuxt.options.runtimeConfig.public.nuxtUsers

    // Add early auth initialization plugin (runs before middleware)
    // Name starts with '0' to ensure it runs early in plugin lifecycle
    addPlugin({
      src: resolver.resolve('./runtime/plugin.auth-init'),
      name: '0-auth-init-nuxt-users'
    })

    addPlugin({
      src: resolver.resolve('./runtime/plugin'),
      mode: 'server'
    })

    addImportsDir(resolver.resolve('./runtime/composables'))
    addServerImportsDir(resolver.resolve('./runtime/server/composables'))

    // Add server middleware for authentication
    addServerHandler({
      middleware: true,
      handler: resolver.resolve('./runtime/server/middleware/authorization.server')
    })

    addRouteMiddleware({
      name: 'authorization.client',
      path: resolver.resolve('./runtime/middleware/authorization.client'),
      global: true,
    })

    // Register API routes under configurable base path
    const base = runtimeConfigOptions.apiBasePath || defaultOptions.apiBasePath

    // Auth/session
    addServerHandler({
      route: `${base}/session`,
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/session/index.post')
    })

    addServerHandler({
      route: `${base}/session`,
      method: 'delete',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/session/index.delete')
    })

    // Current user
    addServerHandler({
      route: `${base}/me`,
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/me.get')
    })

    addServerHandler({
      route: `${base}/me`,
      method: 'patch',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/me.patch')
    })

    // Password
    addServerHandler({
      route: `${base}/password`,
      method: 'patch',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/password/index.patch')
    })

    addServerHandler({
      route: `${base}/password/forgot`,
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/password/forgot.post')
    })

    addServerHandler({
      route: `${base}/password/reset`,
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/password/reset.post')
    })

    // Registration
    addServerHandler({
      route: `${base}/register`,
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/register.post')
    })

    // Email confirmation
    addServerHandler({
      route: `${base}/confirm-email`,
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/confirm-email.get')
    })

    // Google OAuth
    addServerHandler({
      route: `${base}/auth/google/redirect`,
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/auth/google/redirect.get')
    })

    addServerHandler({
      route: `${base}/auth/google/callback`,
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/auth/google/callback.get')
    })

    // User management
    addServerHandler({
      route: `${base}`,
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/index.get')
    })

    addServerHandler({
      route: `${base}`,
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/index.post')
    })

    addServerHandler({
      route: `${base}/:id`,
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/[id].get')
    })

    addServerHandler({
      route: `${base}/:id`,
      method: 'patch',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/[id].patch')
    })

    addServerHandler({
      route: `${base}/:id`,
      method: 'delete',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/[id].delete')
    })

    // Register Nitro config
    nuxt.hook('nitro:config', async (nitroConfig) => {
      nitroConfig.experimental = nitroConfig.experimental || {}
      nitroConfig.experimental.database = true
      nitroConfig.experimental.tasks = true

      // Add tasks directory to scan
      nitroConfig.scanDirs = nitroConfig.scanDirs || []
      nitroConfig.scanDirs.push(resolver.resolve('./runtime/server/tasks'))

      // Schedule automatic token cleanup if enabled
      const cleanupSchedule = runtimeConfigOptions.tokenCleanupSchedule ?? defaultOptions.tokenCleanupSchedule
      if (cleanupSchedule) {
        nitroConfig.scheduledTasks = nitroConfig.scheduledTasks || {}
        nitroConfig.scheduledTasks[cleanupSchedule] = [
          ...(nitroConfig.scheduledTasks[cleanupSchedule] || []),
          'nuxt-users:cleanup-tokens'
        ]
        console.log(`[Nuxt Users] 🔄 Token cleanup scheduled: ${cleanupSchedule}`)
      }

      // Automatically exclude nuxt-users API routes from prerendering to prevent build hangs
      nitroConfig.prerender = nitroConfig.prerender || {}
      nitroConfig.prerender.ignore = nitroConfig.prerender.ignore || []

      const apiBasePath = runtimeConfigOptions.apiBasePath || defaultOptions.apiBasePath
      const ignorePattern = `${apiBasePath}/**`

      if (!nitroConfig.prerender.ignore.includes(ignorePattern)) {
        nitroConfig.prerender.ignore.push(ignorePattern)
        console.log(`[Nuxt Users] 🔧 Automatically excluding "${ignorePattern}" from prerendering to prevent build hangs`)
      }

      // NOTE: We no longer configure the database connection here at build time
      // because it prevents runtime environment variables from being used.
      // The database connection is now established at runtime through useDb()
      // which properly reads from useRuntimeConfig()
    })

    // Auto-register all components from the components directory
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      pathPrefix: false,
      prefix: '',
      global: true
    })

    nuxt.options.css = nuxt.options.css || []
    nuxt.options.css.push(resolver.resolve('./runtime/assets/nuxt-users.css'))
  },
})
// Export runtime server utils for CLI access
export * from './runtime/server/internal/index'
