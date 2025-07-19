import { defineNuxtModule, addPlugin, createResolver, addServerHandler, addComponent } from '@nuxt/kit'
import { defu } from 'defu'
import { checkPersonalAccessTokensTableExists, checkUsersTableExists, hasAnyUsers, checkPasswordResetTokensTableExists } from './runtime/server/utils/db' // Added import
import { getAppliedMigrations } from './runtime/server/utils/migrate'
import type { ModuleOptions } from './types'
import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'

export const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/default.sqlite3',
    },
  },
  tables: {
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
  passwordResetBaseUrl: 'http://localhost:3000', // Added
  // Add option to disable database checks during setup
  skipDatabaseChecks: false,
}

// Helper function to run database operations with timeout
const runWithTimeout = async <T>(operation: () => Promise<T>, timeoutMs: number = 5000): Promise<T | null> => {
  return Promise.race([
    operation(),
    new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('[Nuxt Users DB] ⚠️  Database operation timed out after', timeoutMs, 'ms')
        resolve(null)
      }, timeoutMs)
    })
  ])
}

// Helper function to ensure SQLite database file exists
const ensureSqliteDatabaseExists = async (options: ModuleOptions) => {
  if (options.connector?.name === 'sqlite' && options.connector.options.path) {
    const dbPath = options.connector.options.path

    try {
      // Check if database file exists
      await fs.access(dbPath)
      console.log(`[Nuxt Users DB] ℹ️  SQLite database exists: ${dbPath}`)
    }
    catch {
      // Database file doesn't exist, create directory and empty database
      try {
        const dbDir = dirname(dbPath)
        await fs.mkdir(dbDir, { recursive: true })

        // Create an empty SQLite database file
        // SQLite will create the file when we first connect to it
        console.log(`[Nuxt Users DB] ℹ️  Created SQLite database directory: ${dbDir}`)
        console.log(`[Nuxt Users DB] ℹ️  SQLite database will be created at: ${dbPath}`)
      }
      catch (error) {
        console.warn(`[Nuxt Users DB] ⚠️  Failed to create database directory: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }
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

    // Ensure SQLite database file exists (for default SQLite setup)
    await ensureSqliteDatabaseExists(options)

    // Check applied migrations with timeout (only if not skipping checks)
    if (!options.skipDatabaseChecks) {
      const appliedMigrations = await runWithTimeout(() => getAppliedMigrations(options)) || []
      const requiredMigrations = [
        'create_migrations_table',
        'create_users_table',
        'create_personal_access_tokens_table',
        'create_password_reset_tokens_table'
      ]

      const missingMigrations = requiredMigrations.filter(migration => !appliedMigrations.includes(migration))

      if (missingMigrations.length > 0) {
        console.warn(`[Nuxt Users DB] ⚠️  Missing migrations: ${missingMigrations.join(', ')}`)
        console.warn('[Nuxt Users DB] ⚠️  Run migrations with: npx nuxt-users-migrate')
      }
    }

    // Add runtime config (server-side)
    // Defu will deeply merge the default options with the user-provided options
    const runtimeConfigOptions = defu(options, nuxt.options.runtimeConfig.nuxtUsers || {}, defaultOptions)

    nuxt.options.runtimeConfig.nuxtUsers = {
      ...runtimeConfigOptions,
      tables: {
        users: options.tables?.users || 'users',
        personalAccessTokens: options.tables?.personalAccessTokens || 'personal_access_tokens',
        passwordResetTokens: options.tables?.passwordResetTokens || 'password_reset_tokens',
      },
    }

    // Initialize table status variables
    let hasUsersTable = false
    let hasPersonalAccessTokensTable = false
    let hasPasswordResetTokensTable = false

    // Skip database checks if configured to do so
    if (!options.skipDatabaseChecks) {
      // Check if the users table exists with timeout
      hasUsersTable = await runWithTimeout(() => checkUsersTableExists(options)) || false
      if (!hasUsersTable) {
        console.warn('[Nuxt Users DB] ⚠️  Users table does not exist, you should run the migration script to create it by running: npx nuxt-users-migrate')
      }

      hasPersonalAccessTokensTable = await runWithTimeout(() => checkPersonalAccessTokensTableExists(options)) || false
      if (!hasPersonalAccessTokensTable) {
        console.warn('[Nuxt Users DB] ⚠️  Personal access tokens table does not exist, you should run the migration script to create it by running: npx nuxt-users-migrate')
      }

      hasPasswordResetTokensTable = await runWithTimeout(() => checkPasswordResetTokensTableExists(options)) || false
      if (!hasPasswordResetTokensTable) {
        console.warn('[Nuxt Users DB] ⚠️  Password reset tokens table does not exist, you should run the migration script to create it by running: npx nuxt-users-migrate')
      }

      const hasUsers = await runWithTimeout(() => hasAnyUsers(options)) || false
      if (!hasUsers) {
        console.warn('[Nuxt Users DB] ⚠️  No users found! Create a default user by running: npx nuxt-users-create-user rrd@example.com "John Doe" mypassword123')
      }
    }
    else {
      console.log('[Nuxt Users DB] ℹ️  Skipping database checks during setup')
    }

    // Expose tables info to client-side
    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {}
    nuxt.options.runtimeConfig.public.nuxtUsers = {
      tables: {
        users: hasUsersTable,
        personalAccessTokens: hasPersonalAccessTokensTable,
        passwordResetTokens: hasPasswordResetTokensTable,
      },
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
