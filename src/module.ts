import { defineNuxtModule, addPlugin, createResolver, addServerHandler, addComponent } from '@nuxt/kit'
import { defu } from 'defu'
import { checkPersonalAccessTokensTableExists, checkUsersTableExists, hasAnyUsers } from './runtime/server/utils/db'
import type { ModuleOptions } from './types'

export const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/db.sqlite3',
    },
  },
  tables: {
    users: false,
    personalAccessTokens: false,
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

    // Check if the users table exists
    const hasUsersTable = await checkUsersTableExists(options)
    if (!hasUsersTable) {
      console.warn('[Nuxt Users DB] ⚠️  Users table does not exist, you should run the migration script to create it by running: yarn db:create-users-table')
    }

    const hasPersonalAccessTokensTable = await checkPersonalAccessTokensTableExists(options)
    if (!hasPersonalAccessTokensTable) {
      console.warn('[Nuxt Users DB] ⚠️  Personal access tokens table does not exist, you should run the migration script to create it by running: yarn db:create-personal-access-tokens-table')
    }

    // Add runtime config (server-side)
    nuxt.options.runtimeConfig.nuxtUsers = defu(nuxt.options.runtimeConfig.nuxtUsers || {}, {
      connector: options.connector,
      tables: {
        users: hasUsersTable,
        personalAccessTokens: hasPersonalAccessTokensTable,
      },
    })

    // Expose tables info to client-side
    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {}
    nuxt.options.runtimeConfig.public.nuxtUsers = {
      tables: {
        users: hasUsersTable,
        personalAccessTokens: hasPersonalAccessTokensTable,
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

    addPlugin(resolver.resolve('./runtime/plugin'))

    // Register the LoginForm component
    addComponent({
      name: 'LoginForm',
      filePath: resolver.resolve('./runtime/components/LoginForm.vue')
    })
  },
})
