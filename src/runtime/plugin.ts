import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import type { ModuleOptions } from '../types'
import { checkTableExists } from 'nuxt-users/utils'

export default defineNuxtPlugin(async (_nuxtApp) => {
  // Only run on server side since we're checking database tables
  if (import.meta.client) {
    return
  }

  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  const hasMigrationsTable = await checkTableExists(options, options.tables.migrations)
  if (!hasMigrationsTable) {
    useRuntimeConfig().public.nuxtUsers.tables.migrations = ''
    console.warn('[Nuxt Users] ⚠️  Migrations table does not exist, you should run the migration script to create it by running: npx nuxt-users migrate')
  }
})
