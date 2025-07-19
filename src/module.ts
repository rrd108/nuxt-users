import { defineNuxtModule, addPlugin, createResolver, addServerHandler, addComponent } from '@nuxt/kit'
import { defu } from 'defu'
import { checkPersonalAccessTokensTableExists, checkUsersTableExists, hasAnyUsers, checkPasswordResetTokensTableExists } from './runtime/server/utils/db' // Added import
import { getAppliedMigrations, runMigrations } from './runtime/server/utils/migrate'
import type { ModuleOptions } from './types'
import { createUsersTable } from './runtime/server/utils/create-users-table'
import { createUser } from './runtime/server/utils/user'
import { createPersonalAccessTokensTable } from './runtime/server/utils/create-personal-access-tokens-table'
import { createPasswordResetTokensTable } from './runtime/server/utils/create-password-reset-tokens-table'
import { createMigrationsTable } from './runtime/server/utils/create-migrations-table'

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
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-users',
    configKey: 'nuxtUsers',
  },
  // Default configuration options of the Nuxt module
  defaults: defaultOptions,

  hooks: {
    'commands:register': ({ nuxt, commands }) => {
      commands['users:migrate'] = async () => {
        console.log('[Nuxt Users] Starting migration system...')
        try {
          await runMigrations(nuxt.options.runtimeConfig.nuxtUsers)
          console.log('[Nuxt Users] Migration completed successfully!')
          process.exit(0)
        }
        catch (error) {
          console.error('[Nuxt Users] Migration failed:', error)
          process.exit(1)
        }
      }

      commands['users:create-users-table'] = async () => {
        console.log('[Nuxt Users] Creating users table...')
        try {
          await createUsersTable(nuxt.options.runtimeConfig.nuxtUsers)
          console.log('[Nuxt Users] Users table created successfully!')
          process.exit(0)
        }
        catch (error) {
          console.error('[DB:Create Users Table] Error:', error)
          process.exit(1)
        }
      }

      commands['users:create-user'] = async (args) => {
        const [email, name, password] = args._
        if (!email || !name || !password) {
          console.error('Usage: npx nuxi users:create-user <email> <name> <password>')
          process.exit(1)
        }

        try {
          const user = await createUser({ email, name, password }, nuxt.options.runtimeConfig.nuxtUsers)
          console.log(`[DB:Create User] User created successfully: ${user.email}`)
          process.exit(0)
        }
        catch (error) {
          console.error('[DB:Create User] Error:', error)
          process.exit(1)
        }
      }

      commands['users:create-personal-access-tokens-table'] = async () => {
        console.log('[Nuxt Users] Creating personal access tokens table...')
        try {
          await createPersonalAccessTokensTable(nuxt.options.runtimeConfig.nuxtUsers)
          console.log('[Nuxt Users] Personal access tokens table created successfully!')
          process.exit(0)
        }
        catch (error) {
          console.error('[DB:Create Personal Access Tokens Table] Error:', error)
          process.exit(1)
        }
      }

      commands['users:create-password-reset-tokens-table'] = async () => {
        console.log('[Nuxt Users] Creating password reset tokens table...')
        try {
          await createPasswordResetTokensTable(nuxt.options.runtimeConfig.nuxtUsers)
          console.log('[Nuxt Users] Password reset tokens table created successfully!')
          process.exit(0)
        }
        catch (error) {
          console.error('[DB:Create Password Reset Tokens Table] Error:', error)
          process.exit(1)
        }
      }

      commands['users:create-migrations-table'] = async () => {
        console.log('[Nuxt Users] Creating migrations table...')
        try {
          await createMigrationsTable(nuxt.options.runtimeConfig.nuxtUsers)
          console.log('[Nuxt Users] Migrations table created successfully!')
          process.exit(0)
        }
        catch (error) {
          console.error('[DB:Create Migrations Table] Error:', error)
          process.exit(1)
        }
      }
    },
  },

  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Check applied migrations
    const appliedMigrations = await getAppliedMigrations(options)
    const requiredMigrations = [
      'create_migrations_table',
      'create_users_table',
      'create_personal_access_tokens_table',
      'create_password_reset_tokens_table'
    ]

    const missingMigrations = requiredMigrations.filter(migration => !appliedMigrations.includes(migration))

    if (missingMigrations.length > 0) {
      console.warn(`[Nuxt Users DB] ⚠️  Missing migrations: ${missingMigrations.join(', ')}`)
      console.warn('[Nuxt Users DB] ⚠️  Run migrations with: npx nuxi users:migrate')
    }

    // Check if the users table exists
    const hasUsersTable = await checkUsersTableExists(options)
    if (!hasUsersTable) {
      console.warn('[Nuxt Users DB] ⚠️  Users table does not exist, you should run the migration script to create it by running: npx nuxi users:migrate')
    }

    const hasPersonalAccessTokensTable = await checkPersonalAccessTokensTableExists(options)
    if (!hasPersonalAccessTokensTable) {
      console.warn('[Nuxt Users DB] ⚠️  Personal access tokens table does not exist, you should run the migration script to create it by running: npx nuxi users:migrate')
    }

    const hasPasswordResetTokensTable = await checkPasswordResetTokensTableExists(options) // Call and store
    if (!hasPasswordResetTokensTable) {
      console.warn('[Nuxt Users DB] ⚠️  Password reset tokens table does not exist, you should run the migration script to create it by running: npx nuxi users:migrate')
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
      console.warn('[Nuxt Users DB] ⚠️  No users found! Create a default user by running: npx nuxi users:create-user rrd@example.com "John Doe" mypassword123')
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
