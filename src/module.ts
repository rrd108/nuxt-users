import { defineNuxtModule, createResolver, addServerHandler, addComponent, addPlugin, addImportsDir, addRouteMiddleware } from '@nuxt/kit'
import { defu } from 'defu'
import type { ModuleOptions } from './types'

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
    whitelist: ['/login'],
    tokenExpiration: 24 * 60, // 24 hours
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

export default defineNuxtModule<ModuleOptions>({
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
        tokenExpiration: options.auth?.tokenExpiration || defaultOptions.auth.tokenExpiration
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
        whitelist: [...(defaultOptions.auth?.whitelist || []), ...(options.auth?.whitelist || [])]
      }
    }

    addPlugin({
      src: resolver.resolve('./runtime/plugin'),
      mode: 'server'
    })

    addImportsDir(resolver.resolve('./runtime/composables'))

    // middlewares
    addServerHandler({
      middleware: true,
      handler: resolver.resolve('./runtime/server/middleware/auth.server'),
    })

    addRouteMiddleware({
      name: 'auth.client',
      path: resolver.resolve('./runtime/middleware/auth.client'),
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
      route: '/api/user/profile',
      method: 'get',
      handler: resolver.resolve('./runtime/server/api/user/profile.get')
    })

    addServerHandler({
      route: '/api/auth/update-password',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/auth/update-password.post')
    })

    // Register Nitro tasks
    nuxt.options.nitro = nuxt.options.nitro || {}
    nuxt.options.nitro.experimental = nuxt.options.nitro.experimental || {}
    nuxt.options.nitro.experimental.tasks = true
    
    // Add task handlers
    addServerHandler({
      handler: resolver.resolve('./runtime/server/tasks/cleanup-tokens')
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
