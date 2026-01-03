import { defaultOptions } from '../module'
import type { DatabaseConfig, DatabaseType, ModuleOptions } from 'nuxt-users/utils'
import { loadNuxt } from '@nuxt/kit'
import { defu } from 'defu'

export const getOptionsFromEnv = (): ModuleOptions => {
  const connectorName = process.env.DB_CONNECTOR || 'sqlite' as DatabaseType

  let connectorOptions: DatabaseConfig

  switch (connectorName) {
    case 'sqlite':
      connectorOptions = {
        path: process.env.DB_PATH || './data/users.sqlite3',
      }
      break
    case 'mysql':
      connectorOptions = {
        host: process.env.DB_HOST || 'localhost',
        port: Number.parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nuxt_users',
      }
      break
    case 'postgresql':
      connectorOptions = {
        host: process.env.DB_HOST || 'localhost',
        port: Number.parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nuxt_users',
      }
      break
    default:
      throw new Error(`Unsupported database connector: ${connectorName}`)
  }

  return {
    ...defaultOptions,
    connector: {
      name: connectorName as DatabaseType,
      options: connectorOptions,
    },
  }
}

export const loadOptions = async (): Promise<ModuleOptions> => {
  try {
    // Try to load Nuxt configuration first
    console.log('[Nuxt Users] Loading Nuxt project...')
    console.log('[Nuxt Users] ℹ️  Note: CLI commands read .env files. If you use .env.local in development, export variables first:')
    console.log('[Nuxt Users]    set -a; source .env.local; set +a; npx nuxt-users <command>')
    console.log('[Nuxt Users]    In production, environment variables are set directly in the deployment environment.')
    const nuxt = await loadNuxt({ cwd: process.cwd(), ready: false })

    // Get both configurations
    // 1. Top-level nuxtUsers (for module-style config)
    // 2. runtimeConfig.nuxtUsers (for runtime-style config - use processed config which has env vars resolved)
    const topLevelConfig = nuxt.options.nuxtUsers as ModuleOptions

    // Use the processed runtime config which has environment variables already resolved
    // This is important because Nuxt processes runtimeConfig and fills in NUXT_* env vars
    const processedRuntimeConfig = nuxt.options.runtimeConfig?.nuxtUsers as ModuleOptions | undefined

    await nuxt.close()

    // Check if we have any configuration
    if (topLevelConfig || processedRuntimeConfig) {
      console.log('[Nuxt Users] Using configuration from nuxt.config')
      // Merge configurations with priority: topLevel > runtime > defaults
      // Exclude connector from defaults to prevent mixing sqlite and mysql settings
      const { connector: _defaultConnector, ...defaultsWithoutConnector } = defaultOptions
      const mergedConfig = defu(topLevelConfig, processedRuntimeConfig, defaultsWithoutConnector) as ModuleOptions

      // Use the configured connector or fallback to default (don't merge connector options)
      const configuredConnector = topLevelConfig?.connector || processedRuntimeConfig?.connector
      mergedConfig.connector = configuredConnector || defaultOptions.connector

      // Validate connector options are complete, and fill in from env vars if missing
      if (mergedConfig.connector.name === 'mysql' || mergedConfig.connector.name === 'postgresql') {
        const options = mergedConfig.connector.options as DatabaseConfig & { user?: string, password?: string, host?: string, database?: string, port?: number }
        const envOptions: Partial<DatabaseConfig> = {}

        // Fill in missing values from environment variables
        if (!options.user && process.env.DB_USER) {
          envOptions.user = process.env.DB_USER
        }
        if (!options.password && process.env.DB_PASSWORD) {
          envOptions.password = process.env.DB_PASSWORD
        }
        if (!options.host && process.env.DB_HOST) {
          envOptions.host = process.env.DB_HOST
        }
        if (!options.database && process.env.DB_NAME) {
          envOptions.database = process.env.DB_NAME
        }
        if (!options.port && process.env.DB_PORT) {
          envOptions.port = Number.parseInt(process.env.DB_PORT)
        }

        // Merge env options if any were found
        if (Object.keys(envOptions).length > 0) {
          mergedConfig.connector.options = { ...options, ...envOptions } as DatabaseConfig
          console.log('[Nuxt Users] Filled in missing connector options from environment variables')
        }

        // Final validation
        const finalOptions = mergedConfig.connector.options as DatabaseConfig & { user?: string, password?: string, host?: string, database?: string }
        if (!finalOptions.user || !finalOptions.password || !finalOptions.host || !finalOptions.database) {
          console.warn('[Nuxt Users] Warning: MySQL/PostgreSQL connector options are incomplete.')
          console.warn('[Nuxt Users] Required: user, password, host, database')
          console.warn('[Nuxt Users] Found:', {
            user: finalOptions.user || '(missing)',
            password: finalOptions.password ? '***' : '(missing)',
            host: finalOptions.host || '(missing)',
            database: finalOptions.database || '(missing)'
          })
          console.warn('[Nuxt Users] Please set these in nuxt.config.ts or as environment variables (DB_USER, DB_PASSWORD, DB_HOST, DB_NAME)')
        }
      }

      return mergedConfig
    }

    // No configuration found, use environment variables
    console.log('[Nuxt Users] No nuxt-users configuration found, using environment variables')
    return getOptionsFromEnv()
  }
  catch (error) {
    console.log('[Nuxt Users] Could not load Nuxt project, using environment variables')
    console.error('[Nuxt Users] Error:', error)
    return getOptionsFromEnv()
  }
}
