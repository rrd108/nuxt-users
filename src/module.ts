import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

import { defineNuxtModule, addPlugin, createResolver, addServerHandler } from '@nuxt/kit'
import { defu } from 'defu'

// Module options TypeScript interface definition
export interface ModuleOptions {
  /**
   * Whether to automatically run database migrations.
   * @default true
   */
  runMigrations: boolean;
  /**
   * API base path for auth routes
   * @default '/auth'
   */
  apiBasePath: string;
  /**
   * Path for the database file when using fs driver.
   * @default join(tmpdir(), '.data/nuxt-users')
   */
  dbPath?: string;
  /**
   * Set to true to use in-memory database. Useful for testing.
   * @default false
   */
  dbTestMode?: boolean;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-users',
    configKey: 'nuxtUsers',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  // Default configuration options of the Nuxt module
  defaults: {
    runMigrations: true,
    apiBasePath: '/auth',
    dbTestMode: false,
    // dbPath is resolved in setup if not provided
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add runtime config (server-side)
    nuxt.options.runtimeConfig.nuxtUsers = defu(nuxt.options.runtimeConfig.nuxtUsers || {}, {
      runMigrations: options.runMigrations,
      dbPath: options.dbPath, // Will be undefined if not set, db/index.ts handles default
      dbTestMode: options.dbTestMode || process.env.NUXT_USERS_DB_TEST_MODE === 'true',
    })
    // Public runtime config (client-side)
    nuxt.options.runtimeConfig.public.nuxtUsers = defu(nuxt.options.runtimeConfig.public.nuxtUsers || {}, {
      apiBasePath: options.apiBasePath,
      // dbTestMode and dbPath are not needed client-side
    })

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugin'))

    // Add Nitro plugin for database initialization (runs once on server startup)
    if (options.runMigrations) {
      nuxt.hooks.hook('nitro:config', (nitroConfig) => {
        nitroConfig.plugins = nitroConfig.plugins || []
        nitroConfig.plugins.push(resolver.resolve('./runtime/server/plugins/migrations'))
      })
    }
  },
})
