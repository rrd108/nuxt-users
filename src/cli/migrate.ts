import { defineCommand } from 'citty'
import { runMigrations } from '../utils'
import { getOptionsFromEnv } from './utils'
import { loadNuxt } from '@nuxt/kit'
import type { ModuleOptions } from '../types'

export default defineCommand({
  meta: {
    name: 'migrate',
    description: 'Run database migrations for the Nuxt Users module'
  },
  async run() {
    console.log('[Nuxt Users] Starting migration system...')

    let options: ModuleOptions
    try {
      // Try to load Nuxt configuration first
      console.log('[Nuxt Users] Loading Nuxt project...')
      const nuxt = await loadNuxt({ cwd: process.cwd() })
      const nuxtUsersConfig = nuxt.options.runtimeConfig?.nuxtUsers as ModuleOptions
      await nuxt.close()

      if (nuxtUsersConfig) {
        console.log('[Nuxt Users] Using configuration from Nuxt project')
        options = nuxtUsersConfig
      }
      else {
        console.log('[Nuxt Users] No nuxt-users configuration found, using environment variables')
        options = getOptionsFromEnv()
      }
    }
    catch (error) {
      console.log('[Nuxt Users] Could not load Nuxt project, using environment variables')
      console.error(error)
      options = getOptionsFromEnv()
    }

    try {
      await runMigrations(options)
      console.log('[Nuxt Users] Migration completed successfully!')
      process.exit(0)
    }
    catch (error) {
      console.error('[Nuxt Users] Migration failed:', error)
      process.exit(1)
    }
  }
})
