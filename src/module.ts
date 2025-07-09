import { defineNuxtModule, addPlugin, createResolver, addServerHandler, addComponent } from '@nuxt/kit'
import { defu } from 'defu'
import { checkUsersTableExists, hasAnyUsers } from './runtime/server/utils/db'
import type { ModuleOptions } from './types'

export const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/db.sqlite3',
    },
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
    nuxt.options.runtimeConfig.nuxtUsers = defu(nuxt.options.runtimeConfig.nuxtUsers || {}, {
      connector: options.connector,
    })

    // Check if the users table exists
    const exists = await checkUsersTableExists(options)
    if (!exists) {
      console.warn('[Nuxt Users DB] Users table does not exist, you should run the migration script to create it by running: yarn db:create-users-table')
    }

    const hasUsers = await hasAnyUsers(options)
    if (!hasUsers) {
      console.warn('[Nuxt Users DB] No users found! Create a default user by running: yarn db:create-user rrd@example.com "John Doe" mypassword123')
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
