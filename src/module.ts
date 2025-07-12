import { defineNuxtModule, addPlugin, createResolver, addServerHandler, addComponent } from '@nuxt/kit'
import { defu } from 'defu'
import { checkPersonalAccessTokensTableExists, checkUsersTableExists, hasAnyUsers, checkPasswordResetTokensTableExists } from './runtime/server/utils/db' // Added import
import type { ModuleOptions } from './types'

export const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/default.sqlite3',
    },
  },
  tables: {
    users: false,
    personalAccessTokens: false,
    passwordResetTokens: false, // Added
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
  passwordResetBaseUrl: 'http://localhost:3000', // Added
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

    // Check if the users table exists
    const hasUsersTable = await checkUsersTableExists(options)
    if (!hasUsersTable) {
      console.warn('[Nuxt Users DB] ⚠️  Users table does not exist, you should run the migration script to create it by running: yarn db:create-users-table')
    }

    const hasPersonalAccessTokensTable = await checkPersonalAccessTokensTableExists(options)
    if (!hasPersonalAccessTokensTable) {
      console.warn('[Nuxt Users DB] ⚠️  Personal access tokens table does not exist, you should run the migration script to create it by running: yarn db:create-personal-access-tokens-table')
    }

    const hasPasswordResetTokensTable = await checkPasswordResetTokensTableExists(options) // Call and store
    if (!hasPasswordResetTokensTable) {
      console.warn('[Nuxt Users DB] ⚠️  Password reset tokens table does not exist, you should run the migration script to create it by running: yarn db:create-password-reset-tokens-table')
    }

    // Add runtime config (server-side)
    // Defu will deeply merge the default options with the user-provided options
    const runtimeConfigOptions = defu(options, nuxt.options.runtimeConfig.nuxtUsers || {}, defaultOptions)

    nuxt.options.runtimeConfig.nuxtUsers = {
      connector: runtimeConfigOptions.connector,
      mailer: runtimeConfigOptions.mailer, // Added mailer config
      passwordResetBaseUrl: runtimeConfigOptions.passwordResetBaseUrl, // Added base URL
      tables: {
        users: hasUsersTable,
        personalAccessTokens: hasPersonalAccessTokensTable,
        passwordResetTokens: hasPasswordResetTokensTable, // Use stored value
      },
    }

    // Expose tables info to client-side
    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {}
    nuxt.options.runtimeConfig.public.nuxtUsers = {
      tables: {
        users: hasUsersTable,
        personalAccessTokens: hasPersonalAccessTokensTable,
        passwordResetTokens: hasPasswordResetTokensTable, // Use stored value
      },
    }

    const hasUsers = await hasAnyUsers(options)
    if (!hasUsers) {
      console.warn('[Nuxt Users DB] ⚠️  No users found! Create a default user by running: yarn db:create-user rrd@example.com "John Doe" mypassword123')
    }

    // Register API routes
    addServerHandler({
      route: '/api/login',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/login.post')
    })

    addServerHandler({
      route: '/api/forgot-password',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/auth/forgot-password.post')
    })

    addServerHandler({
      route: '/api/reset-password',
      method: 'post',
      handler: resolver.resolve('./runtime/server/api/auth/reset-password.post')
    })

    addPlugin(resolver.resolve('./runtime/plugin'))

    // Register the LoginForm component
    addComponent({
      name: 'LoginForm',
      filePath: resolver.resolve('./runtime/components/LoginForm.vue')
    })

    // Register the ForgotPasswordForm component
    addComponent({
      name: 'ForgotPasswordForm',
      filePath: resolver.resolve('./runtime/components/ForgotPasswordForm.vue')
    })

    // Register the ResetPasswordForm component
    addComponent({
      name: 'ResetPasswordForm',
      filePath: resolver.resolve('./runtime/components/ResetPasswordForm.vue')
    })
  },
})
