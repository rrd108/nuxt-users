import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import type { ModuleOptions } from './utils/imports'
import { checkTableExists, isBuildTime } from './server/utils'

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  // Skip database checks during build/prerendering to prevent hanging
  if (isBuildTime()) {
    console.log('[Nuxt Users] 🔧 Build-time detected, skipping database connection checks')
    return
  }

  try {
    const hasMigrationsTable = await checkTableExists(options, options.tables.migrations)
    if (!hasMigrationsTable) {
      console.warn('[Nuxt Users] ⚠️  Migrations table does not exist, you should run the migration script to create it by running: npx nuxt-users migrate')
    }
  } catch (error) {
    // If database connection fails during runtime, warn but don't crash
    console.warn('[Nuxt Users] ⚠️  Database connection failed during initialization:', error instanceof Error ? error.message : 'Unknown error')
  }
})
