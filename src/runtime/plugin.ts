import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import type { ModuleOptions } from '../types'
import { checkTableExists } from '../utils'

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  console.log({ nuxtUsers })

  const hasMigrationsTable = await checkTableExists(options, options.tables.migrations)
  if (!hasMigrationsTable) {
    console.warn('[Nuxt Users] ⚠️  Migrations table does not exist, you should run the migration script to create it by running: npx nuxt-users migrate')
  }
})
