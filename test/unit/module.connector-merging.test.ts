import { describe, it, expect } from 'vitest'
import { defu } from 'defu'
import { defaultOptions } from '../../src/module'
import type { ModuleOptions } from '../../src/types'

/**
 * Test to demonstrate the connector merging bug in module.ts
 *
 * When a user configures MySQL in runtimeConfig, defu merges it with defaultOptions
 * which contains SQLite settings, resulting in MySQL config having a 'path' property.
 */
describe('Module connector merging bug', () => {
  it('should demonstrate how defu mixes MySQL and SQLite configs (OLD BEHAVIOR)', () => {
    // Simulate what the user has in their nuxt.config.ts
    const userRuntimeConfig = {
      connector: {
        name: 'mysql' as const,
        options: {
          host: 'localhost',
          port: 3306,
          user: '',
          password: '',
          database: ''
        }
      }
    }

    // This is the OLD way (before the fix) - directly merging with defaultOptions
    const runtimeConfigOptions = defu(userRuntimeConfig, {}, defaultOptions) as ModuleOptions

    // BUG: The merged config INCORRECTLY has a path property for MySQL
    console.log('Merged connector options (old way):', runtimeConfigOptions.connector.options)

    // This demonstrates the bug - path should be undefined for MySQL but isn't
    expect(runtimeConfigOptions.connector.options.path).toBe('./data/users.sqlite3')
  })

  it('should show the correct way to merge without mixing connectors', () => {
    const userRuntimeConfig = {
      connector: {
        name: 'mysql' as const,
        options: {
          host: 'localhost',
          port: 3306,
          user: '',
          password: '',
          database: ''
        }
      }
    }

    // FIX: Exclude connector from defaults before merging
    const { connector: _defaultConnector, ...defaultsWithoutConnector } = defaultOptions
    const runtimeConfigOptions = defu(userRuntimeConfig, {}, defaultsWithoutConnector) as ModuleOptions

    // Use the configured connector (don't merge with default)
    runtimeConfigOptions.connector = userRuntimeConfig.connector || defaultOptions.connector

    // This should pass - MySQL config should not have SQLite path
    expect(runtimeConfigOptions.connector.options.path).toBeUndefined()
    expect(runtimeConfigOptions.connector.name).toBe('mysql')
    expect(runtimeConfigOptions.connector.options.host).toBe('localhost')
  })
})
