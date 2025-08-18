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
        path: process.env.DB_PATH || './data/default.sqlite3',
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
    const nuxt = await loadNuxt({ cwd: process.cwd() })
    const nuxtUsersConfig = nuxt.options.nuxtUsers as ModuleOptions
    await nuxt.close()

    if (nuxtUsersConfig) {
      console.log('[Nuxt Users] Using configuration from Nuxt project')
      // Deep merge with defaultOptions to ensure all required fields are present
      return defu(nuxtUsersConfig, defaultOptions)
    }
    else {
      console.log('[Nuxt Users] No nuxt-users configuration found, using environment variables')
      return getOptionsFromEnv()
    }
  }
  catch (error) {
    console.log('[Nuxt Users] Could not load Nuxt project, using environment variables')
    console.error('[Nuxt Users] Error:', error)
    return getOptionsFromEnv()
  }
}
