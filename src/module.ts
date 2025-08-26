import { defineNuxtModule, createResolver, addServerHandler, addComponent, addPlugin, addImportsDir, addRouteMiddleware, addServerImportsDir } from '@nuxt/kit'
import { defu } from 'defu'
import type { RuntimeModuleOptions, ModuleOptions } from './types'

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
  auth: {
    whitelist: [],
    tokenExpiration: 24 * 60, // 24 hours
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
}

export default defineNuxtModule<RuntimeModuleOptions>({
  meta: {
    name: 'nuxt-users',
    configKey: 'nuxtUsers',
  },
  // Default configuration options of the Nuxt module
  defaults: defaultOptions,

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add runtime config (server-side)
    const runtimeConfigOptions = defu(options, nuxt.options.runtimeConfig.nuxtUsers || {}, defaultOptions)

    nuxt.options.runtimeConfig.nuxtUsers = {
      ...runtimeConfigOptions,
      apiBasePath: options.apiBasePath || defaultOptions.apiBasePath,
      passwordResetUrl: options.passwordResetUrl || defaultOptions.passwordResetUrl,
      tables: {
        migrations: options.tables?.migrations || defaultOptions.tables.migrations,
        users: options.tables?.users || defaultOptions.tables.users,
        personalAccessTokens: options.tables?.personalAccessTokens || defaultOptions.tables.personalAccessTokens,
        passwordResetTokens: options.tables?.passwordResetTokens || defaultOptions.tables.passwordResetTokens,
      },
      auth: {
        whitelist: (() => {
          const combinedWhitelist = [...(defaultOptions.auth?.whitelist || []), ...(options.auth?.whitelist || [])]
          // Auto-whitelist /confirm-email if /register is whitelisted
          if (combinedWhitelist.includes('/register') && !combinedWhitelist.includes('/confirm-email')) {
            combinedWhitelist.push('/confirm-email')
          }
          return combinedWhitelist
        })(),
        tokenExpiration: options.auth?.tokenExpiration || defaultOptions.auth.tokenExpiration,
        permissions: options.auth?.permissions || defaultOptions.auth.permissions
      },
      hardDelete: options.hardDelete ?? defaultOptions.hardDelete,
    }

    // Add public runtime config for client-side access
    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {}
    nuxt.options.runtimeConfig.public.nuxtUsers = {
      passwordValidation: {
        minLength: options.passwordValidation?.minLength || defaultOptions.passwordValidation.minLength,
        requireUppercase: options.passwordValidation?.requireUppercase ?? defaultOptions.passwordValidation.requireUppercase,
        requireLowercase: options.passwordValidation?.requireLowercase ?? defaultOptions.passwordValidation.requireLowercase,
        requireNumbers: options.passwordValidation?.requireNumbers ?? defaultOptions.passwordValidation.requireNumbers,
        requireSpecialChars: options.passwordValidation?.requireSpecialChars ?? defaultOptions.passwordValidation.requireSpecialChars,
        preventCommonPasswords: options.passwordValidation?.preventCommonPasswords ?? defaultOptions.passwordValidation.preventCommonPasswords,
      },
      auth: {
        whitelist: (() => {
          const combinedWhitelist = [...(defaultOptions.auth?.whitelist || []), ...(options.auth?.whitelist || [])]
          // Auto-whitelist /confirm-email if /register is whitelisted
          if (combinedWhitelist.includes('/register') && !combinedWhitelist.includes('/confirm-email')) {
            combinedWhitelist.push('/confirm-email')
          }
          return combinedWhitelist
        })(),
        permissions: options.auth?.permissions || defaultOptions.auth.permissions
      },
      apiBasePath: options.apiBasePath || defaultOptions.apiBasePath
    }

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
    const base = (nuxt.options.runtimeConfig.nuxtUsers as ModuleOptions).apiBasePath || defaultOptions.apiBasePath

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

      // Configure Nitro database if not already configured by consumer
      nitroConfig.database = nitroConfig.database || {}

      // Only set default database if not already configured by consumer
      if (!nitroConfig.database.default) {
        // Use nuxt-users database configuration for Nitro's default database
        const connectorOptions = { ...runtimeConfigOptions.connector.options }

        // Map nuxt-users connector format to Nitro database format
        let nitroConnector: 'better-sqlite3' | 'mysql2' | 'postgresql'
        switch (runtimeConfigOptions.connector.name) {
          case 'sqlite':
            nitroConnector = 'better-sqlite3'
            break
          case 'mysql':
            nitroConnector = 'mysql2'
            break
          case 'postgresql':
            nitroConnector = 'postgresql'
            break
          default:
            nitroConnector = 'better-sqlite3'
        }

        nitroConfig.database.default = {
          connector: nitroConnector,
          options: connectorOptions
        }
      }

      nitroConfig.experimental.tasks = true
      // Add tasks directory to scan
      nitroConfig.scanDirs = nitroConfig.scanDirs || []
      nitroConfig.scanDirs.push(resolver.resolve('./runtime/server/tasks'))
    })

    // components
    addComponent({
      name: 'NUsersLoginForm',
      filePath: resolver.resolve('./runtime/components/NUsersLoginForm.vue')
    })

    addComponent({
      name: 'NUsersLogoutLink',
      filePath: resolver.resolve('./runtime/components/NUsersLogoutLink.vue')
    })

    addComponent({
      name: 'NUsersProfileInfo',
      filePath: resolver.resolve('./runtime/components/NUsersProfileInfo.vue')
    })

    addComponent({
      name: 'NUsersResetPasswordForm',
      filePath: resolver.resolve('./runtime/components/NUsersResetPasswordForm.vue')
    })

    addComponent({
      name: 'NUsersPasswordStrengthIndicator',
      filePath: resolver.resolve('./runtime/components/NUsersPasswordStrengthIndicator.vue')
    })

    addComponent({
      name: 'NUsersList',
      filePath: resolver.resolve('./runtime/components/NUsersList.vue')
    })

    addComponent({
      name: 'NUsersUserCard',
      filePath: resolver.resolve('./runtime/components/NUsersUserCard.vue')
    })

    addComponent({
      name: 'NUsersUserForm',
      filePath: resolver.resolve('./runtime/components/NUsersUserForm.vue')
    })

    addComponent({
      name: 'NUsersRegisterForm',
      filePath: resolver.resolve('./runtime/components/NUsersRegisterForm.vue')
    })

    nuxt.options.css = nuxt.options.css || []
    nuxt.options.css.push(resolver.resolve('./runtime/assets/nuxt-users.css'))
  },
})

// Export runtime server utils for CLI access
export * from './runtime/server/internal/index'
