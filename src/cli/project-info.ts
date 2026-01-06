import { defineCommand } from 'citty'
import { loadNuxt } from '@nuxt/kit'
import type { ModuleOptions } from 'nuxt-users/utils'
import { checkTableExists, getAppliedMigrations } from '../runtime/server/utils'

export default defineCommand({
  meta: {
    name: 'project-info',
    description: 'Get information about the Nuxt project and module configuration'
  },
  async run() {
    try {
      console.log('[Nuxt Users] Loading Nuxt project...')
      console.log('[Nuxt Users] ℹ️  Note: CLI commands read .env files. If you use .env.local in development, export variables first:')
      console.log('[Nuxt Users]    set -a; source .env.local; set +a; npx nuxt-users <command>')
      console.log('[Nuxt Users]    In production, environment variables are set directly in the deployment environment.')
      const nuxt = await loadNuxt({ cwd: process.cwd() })

      console.log('[Nuxt Users] ✅ Nuxt project loaded successfully!')
      console.log('[Nuxt Users] 📁 Source directory:', nuxt.options.srcDir)
      console.log('[Nuxt Users] 🌐 Base URL:', nuxt.options.app?.baseURL || '/')
      console.log()

      // Check if nuxt-users module is configured
      const nuxtUsersConfig = nuxt.options.runtimeConfig?.nuxtUsers as ModuleOptions
      if (nuxtUsersConfig) {
        console.log('[Nuxt Users] 💾 Database Configuration:')
        console.log('[Nuxt Users]    Connector:', nuxtUsersConfig.connector?.name)

        // Display database connection details (excluding password)
        if (nuxtUsersConfig.connector?.options) {
          const options = nuxtUsersConfig.connector.options
          const connectorName = nuxtUsersConfig.connector.name

          if (connectorName === 'sqlite') {
            console.log('[Nuxt Users]    Path:', options.path || 'Not configured')
          }

          if (connectorName === 'mysql' || connectorName === 'postgresql') {
            console.log('[Nuxt Users]    Host:', options.host || 'Not configured')
            console.log('[Nuxt Users]    Port:', options.port || 'Not configured')
            console.log('[Nuxt Users]    Database:', options.database || 'Not configured')
            console.log('[Nuxt Users]    User:', options.user || 'Not configured')
          }
        }
        console.log()

        console.log('[Nuxt Users] 📋 Table Configuration:')
        console.log('[Nuxt Users]    Users:', nuxtUsersConfig.tables?.users)
        console.log('[Nuxt Users]    Tokens:', nuxtUsersConfig.tables?.personalAccessTokens)
        console.log('[Nuxt Users]    Password resets:', nuxtUsersConfig.tables?.passwordResetTokens)
        console.log('[Nuxt Users]    Migrations:', nuxtUsersConfig.tables?.migrations)
        console.log()

        // Check migrations table
        try {
          const migrationsTableExists = await checkTableExists(nuxtUsersConfig, 'migrations')
          console.log('[Nuxt Users] 📊 Migration Status:')
          if (migrationsTableExists) {
            const appliedMigrations = await getAppliedMigrations(nuxtUsersConfig)
            console.log('[Nuxt Users]    Table exists: yes ✅')
            console.log('[Nuxt Users]    Applied migrations:', appliedMigrations.length)
            if (appliedMigrations.length > 0) {
              appliedMigrations.forEach((migration) => {
                console.log('[Nuxt Users]      -', migration)
              })
            }
          }
          if (!migrationsTableExists) {
            console.log('[Nuxt Users]    Table exists: no ❌')
            console.log('[Nuxt Users]    ➡️  Run "npx nuxt-users migrate" to set up the database')
          }
        }
        catch (error) {
          console.log('[Nuxt Users]    Status: ⚠️  Error -', error instanceof Error ? error.message : 'Unknown error')
        }
      }
      if (!nuxtUsersConfig) {
        console.log('[Nuxt Users] ⚠️  Nuxt Users module not configured in runtime config')
      }
    }
    catch (error) {
      console.error('[Nuxt Users] ❌ Could not load Nuxt project:', error)
      process.exit(1)
    }
  }
})
