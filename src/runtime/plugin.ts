import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import type { ModuleOptions } from './utils/imports'
import { checkTableExists } from './server/utils'

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { nuxtUsers } = useRuntimeConfig()
  // const { public: { nuxtUsers: publicNuxtUsers } } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  // const publicOptions = publicNuxtUsers as ModuleOptions

  const hasMigrationsTable = await checkTableExists(options, options.tables.migrations)
  if (!hasMigrationsTable) {
    console.warn('[Nuxt Users] ⚠️  Migrations table does not exist, you should run the migration script to create it by running: npx nuxt-users migrate')
  }
})
