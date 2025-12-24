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
    const nuxt = await loadNuxt({ cwd: process.cwd(), ready: false })

    // Get both configurations BEFORE module processing
    // 1. Top-level nuxtUsers (for module-style config)
    // 2. runtimeConfig.nuxtUsers (for runtime-style config - read from the original config)
    const topLevelConfig = nuxt.options.nuxtUsers as ModuleOptions

    // Read the original runtime config before it gets processed by the module
    const originalRuntimeConfig = await (async () => {
      try {
        // Load the nuxt.config.ts file directly to get the original runtime config
        const configPath = await import('node:path').then(p => p.resolve(process.cwd(), 'nuxt.config.ts'))
        const config = await import(configPath).then(m => m.default)
        return config?.runtimeConfig?.nuxtUsers
      }
      catch {
        // Fallback to processed config if direct loading fails
        return nuxt.options.runtimeConfig?.nuxtUsers
      }
    })()

    await nuxt.close()

    // Check if we have any configuration
    if (topLevelConfig || originalRuntimeConfig) {
      console.log('[Nuxt Users] Using configuration from nuxt.config')
      // Merge configurations with priority: topLevel > runtime > defaults
      // Special handling for connector to avoid mixing sqlite and mysql settings
      let mergedConfig = defu(topLevelConfig, originalRuntimeConfig, defaultOptions)

      // If a specific connector is configured, ensure we don't mix default connector settings
      const configuredConnector = topLevelConfig?.connector || originalRuntimeConfig?.connector
      if (configuredConnector) {
        mergedConfig = {
          ...mergedConfig,
          connector: configuredConnector
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
