import { defineCommand } from 'citty'
import { loadNuxt } from '@nuxt/kit'
import type { ModuleOptions } from 'nuxt-users/utils'
import { checkTableExists } from '../runtime/server/utils/db'
import { getAppliedMigrations } from '../runtime/server/utils/migrate'

export default defineCommand({
  meta: {
    name: 'project-info',
    description: 'Get information about the Nuxt project and module configuration'
  },
  async run() {
    try {
      console.log('[Nuxt Users] Loading Nuxt project...')
      const nuxt = await loadNuxt({ cwd: process.cwd() })

      console.log('[Nuxt Users] ✅ Nuxt project loaded successfully!')
      console.log('[Nuxt Users] 📁 Source directory:', nuxt.options.srcDir)
      console.log('[Nuxt Users] 🌐 Base URL:', nuxt.options.app?.baseURL || '/')

      // Check if nuxt-users module is configured
      const nuxtUsersConfig = nuxt.options.runtimeConfig?.nuxtUsers as ModuleOptions
      if (nuxtUsersConfig) {
        console.log('[Nuxt Users] 🔧 Nuxt Users module configuration:')
        console.log('[Nuxt Users]    Database connector:', nuxtUsersConfig.connector?.name)

        // Display database connection details (excluding password)
        if (nuxtUsersConfig.connector?.options) {
          const options = nuxtUsersConfig.connector.options
          if (options.host) {
            console.log('[Nuxt Users]    Database host:', options.host)
          }
          if (options.port) {
            console.log('[Nuxt Users]    Database port:', options.port)
          }
          if (options.user) {
            console.log('[Nuxt Users]    Database user:', options.user)
          }
          if (options.database) {
            console.log('[Nuxt Users]    Database name:', options.database)
          }
          if (options.path) {
            console.log('[Nuxt Users]    Database path:', options.path)
          }
        }

        console.log('[Nuxt Users]    Users table:', nuxtUsersConfig.tables?.users)
        console.log('[Nuxt Users]    Personal access tokens table:', nuxtUsersConfig.tables?.personalAccessTokens)
        console.log('[Nuxt Users]    Password reset tokens table:', nuxtUsersConfig.tables?.passwordResetTokens)

        // Check migrations table
        try {
          const migrationsTableExists = await checkTableExists(nuxtUsersConfig, 'migrations')
          if (migrationsTableExists) {
            const appliedMigrations = await getAppliedMigrations(nuxtUsersConfig)
            console.log('[Nuxt Users] 📊 Migrations:')
            console.log('[Nuxt Users]    Migrations table exists: ✅')
            console.log('[Nuxt Users]    Applied migrations count:', appliedMigrations.length)
            if (appliedMigrations.length > 0) {
              console.log('[Nuxt Users]    Applied migrations:', appliedMigrations.join(', '))
            }
          }
          else {
            console.log('[Nuxt Users] 📊 Migrations:')
            console.log('[Nuxt Users]    Migrations table exists: ❌')
            console.log('[Nuxt Users]    Run "npx nuxt-users migrate" to set up the database')
          }
        }
        catch (error) {
          console.log('[Nuxt Users] ⚠️  Could not check migrations:', error instanceof Error ? error.message : 'Unknown error')
        }
      }
      else {
        console.log('[Nuxt Users] ⚠️  Nuxt Users module not configured in runtime config')
      }

      // Check public runtime config
      const publicConfig = nuxt.options.runtimeConfig?.nuxtUsers as ModuleOptions
      if (publicConfig) {
        console.log('[Nuxt Users] 🌍 Public runtime config:')
        console.log('[Nuxt Users]    Users table exists:', publicConfig.tables?.users)
        console.log('[Nuxt Users]    Personal access tokens table exists:', publicConfig.tables?.personalAccessTokens)
        console.log('[Nuxt Users]    Password reset tokens table exists:', publicConfig.tables?.passwordResetTokens)
      }
    }
    catch (error) {
      console.error('[Nuxt Users] ❌ Could not load Nuxt project:', error)
      process.exit(1)
    }
  }
})
