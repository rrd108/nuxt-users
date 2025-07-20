import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import type { ModuleOptions } from '../types'
import { checkTableExists } from './server/utils/db'

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  const hasMigrationsTable = await checkTableExists(options, 'migrations')
  if (!hasMigrationsTable) {
    console.warn('[Nuxt Users] ⚠️  Migrations table does not exist, you should run the migration script to create it by running: npx nuxt-users:migrate')
  }
})
