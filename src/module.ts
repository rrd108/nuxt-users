import { defineNuxtModule, createResolver, addServerHandler, addComponent, addPlugin, addImportsDir, addRouteMiddleware } from '@nuxt/kit'
import { defu } from 'defu'
import type { RuntimeModuleOptions, ModuleOptions } from './types'

export const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/users.sqlite3',
    },
  },
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
  passwordResetBaseUrl: 'http://localhost:3000',
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
      tables: {
        migrations: options.tables?.migrations || defaultOptions.tables.migrations,
        users: options.tables?.users || defaultOptions.tables.users,
        personalAccessTokens: options.tables?.personalAccessTokens || defaultOptions.tables.personalAccessTokens,
        passwordResetTokens: options.tables?.passwordResetTokens || defaultOptions.tables.passwordResetTokens,
      },
      auth: {
        whitelist: [...(defaultOptions.auth?.whitelist || []), ...(options.auth?.whitelist || [])],
        tokenExpiration: options.auth?.tokenExpiration || defaultOptions.auth.tokenExpiration,
        permissions: options.auth?.permissions || defaultOptions.auth.permissions
      },
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
        whitelist: [...(defaultOptions.auth?.whitelist || []), ...(options.auth?.whitelist || [])],
        permissions: options.auth?.permissions || defaultOptions.auth.permissions
      }
    }

    addPlugin({
      src: resolver.resolve('./runtime/plugin'),
      mode: 'server'
    })

    addImportsDir(resolver.resolve('./runtime/composables'))

    // Server middleware is auto-registered by Nitro when placed in server/middleware/

    addRouteMiddleware({
      name: 'authorization.client',
      path: resolver.resolve('./runtime/middleware/authorization.client'),
      global: true,
    })

    // Register API routes
    addServerHandler({
      route: '/api/auth/login',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/auth/login.post')
    })

    addServerHandler({
      route: '/api/auth/forgot-password',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/auth/forgot-password.post')
    })

    addServerHandler({
      route: '/api/auth/reset-password',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/auth/reset-password.post')
    })

    addServerHandler({
      route: '/api/auth/logout',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/auth/logout.get')
    })

    addServerHandler({
      route: '/api/nuxt-users/profile',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/profile.get')
    })

    addServerHandler({
      route: '/api/auth/update-password',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/auth/update-password.post')
    })

    // User management API routes
    addServerHandler({
      route: '/api/nuxt-users',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/index.post')
    })

    addServerHandler({
      route: '/api/nuxt-users/:id',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/[id].get')
    })

    addServerHandler({
      route: '/api/nuxt-users/:id',
      method: 'patch',
      handler: resolver.resolve('./runtime/server/api/nuxt-users/[id].patch')
    })

    addServerHandler({
      route: '/api/nuxt-users/:id',
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
      name: 'LoginForm',
      filePath: resolver.resolve('./runtime/components/LoginForm.vue')
    })

    addComponent({
      name: 'LogoutLink',
      filePath: resolver.resolve('./runtime/components/LogoutLink.vue')
    })

    addComponent({
      name: 'ProfileInfo',
      filePath: resolver.resolve('./runtime/components/ProfileInfo.vue')
    })

    addComponent({
      name: 'ResetPasswordForm',
      filePath: resolver.resolve('./runtime/components/ResetPasswordForm.vue')
    })

    // TODOAdd global CSS with color variables
    nuxt.options.css = nuxt.options.css || []
    nuxt.options.css.push(resolver.resolve('./runtime/assets/colors.css'))
  },
})

// Export runtime server utils for CLI access
export * from './runtime/server/utils'
