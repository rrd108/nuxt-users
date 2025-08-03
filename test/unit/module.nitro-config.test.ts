import { describe, it, expect } from 'vitest'
import type { DatabaseType } from '../../src/types'

// Helper function to map connector names (mirrors the actual module logic)
const mapConnectorName = (connectorName: DatabaseType): 'better-sqlite3' | 'mysql2' | 'postgresql' => {
  switch (connectorName) {
    case 'sqlite':
      return 'better-sqlite3'
    case 'mysql':
      return 'mysql2'
    case 'postgresql':
      return 'postgresql'
    default:
      return 'better-sqlite3'
  }
}

// Type for mock Nitro configuration
interface MockNitroConfig {
  experimental?: {
    database?: boolean
    tasks?: boolean
  }
  database?: {
    default?: {
      connector: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options: Record<string, any>
    }
  }
}

describe('Module: Nitro Database Configuration', () => {
  describe('Connector Name Mapping', () => {
    it('should map sqlite to better-sqlite3', () => {
      const result = mapConnectorName('sqlite')
      expect(result).toBe('better-sqlite3')
    })

    it('should map mysql to mysql2', () => {
      const result = mapConnectorName('mysql')
      expect(result).toBe('mysql2')
    })

    it('should map postgresql to postgresql', () => {
      const result = mapConnectorName('postgresql')
      expect(result).toBe('postgresql')
    })

    it('should default to better-sqlite3 for unknown connector', () => {
      const result = mapConnectorName('unknown' as DatabaseType)
      expect(result).toBe('better-sqlite3')
    })
  })

  describe('Nitro Configuration Logic', () => {
    it('should set nitro database when not already configured', () => {
      // Mock nitroConfig (simulates Nitro's configuration object)
      const nitroConfig: MockNitroConfig = {
        experimental: {},
        database: {}
      }

      // Mock runtimeConfigOptions (simulates module's configuration)
      const runtimeConfigOptions = {
        connector: {
          name: 'sqlite' as DatabaseType,
          options: {
            path: './data/test.sqlite3'
          }
        }
      }

      // Simulate the module's nitro:config hook logic
      nitroConfig.experimental = nitroConfig.experimental || {}
      nitroConfig.experimental.database = true
      nitroConfig.database = nitroConfig.database || {}

      if (!nitroConfig.database.default) {
        const connectorOptions = { ...runtimeConfigOptions.connector.options }
        const nitroConnector = mapConnectorName(runtimeConfigOptions.connector.name)

        nitroConfig.database.default = {
          connector: nitroConnector,
          options: connectorOptions
        }
      }

      expect(nitroConfig.experimental.database).toBe(true)
      expect(nitroConfig.database.default).toBeDefined()
      expect(nitroConfig.database.default!.connector).toBe('better-sqlite3')
      expect(nitroConfig.database.default!.options.path).toBe('./data/test.sqlite3')
    })

    it('should not override existing nitro database configuration', () => {
      // Mock nitroConfig with existing database configuration
      const nitroConfig: MockNitroConfig = {
        experimental: {},
        database: {
          default: {
            connector: 'mysql2',
            options: {
              host: 'existing-host',
              database: 'existing-db'
            }
          }
        }
      }

      // Mock runtimeConfigOptions
      const runtimeConfigOptions = {
        connector: {
          name: 'sqlite' as DatabaseType,
          options: {
            path: './data/test.sqlite3'
          }
        }
      }

      // Simulate the module's nitro:config hook logic
      nitroConfig.experimental = nitroConfig.experimental || {}
      nitroConfig.experimental.database = true
      nitroConfig.database = nitroConfig.database || {}

      // This should NOT execute because database.default already exists
      if (!nitroConfig.database.default) {
        const connectorOptions = { ...runtimeConfigOptions.connector.options }
        const nitroConnector = mapConnectorName(runtimeConfigOptions.connector.name)

        nitroConfig.database.default = {
          connector: nitroConnector,
          options: connectorOptions
        }
      }

      // Should preserve existing configuration
      expect(nitroConfig.database.default!.connector).toBe('mysql2')
      expect(nitroConfig.database.default!.options.host).toBe('existing-host')
      expect(nitroConfig.database.default!.options.database).toBe('existing-db')
    })

    it('should properly copy connector options', () => {
      const nitroConfig: MockNitroConfig = {
        experimental: {},
        database: {}
      }

      const runtimeConfigOptions = {
        connector: {
          name: 'mysql' as DatabaseType,
          options: {
            host: 'localhost',
            port: 3306,
            user: 'testuser',
            password: 'testpass',
            database: 'testdb'
          }
        }
      }

      // Simulate the module's logic
      nitroConfig.experimental = nitroConfig.experimental || {}
      nitroConfig.experimental.database = true
      nitroConfig.database = nitroConfig.database || {}

      if (!nitroConfig.database.default) {
        const connectorOptions = { ...runtimeConfigOptions.connector.options }
        const nitroConnector = mapConnectorName(runtimeConfigOptions.connector.name)

        nitroConfig.database.default = {
          connector: nitroConnector,
          options: connectorOptions
        }
      }

      expect(nitroConfig.database.default!.connector).toBe('mysql2')
      expect(nitroConfig.database.default!.options.host).toBe('localhost')
      expect(nitroConfig.database.default!.options.port).toBe(3306)
      expect(nitroConfig.database.default!.options.user).toBe('testuser')
      expect(nitroConfig.database.default!.options.password).toBe('testpass')
      expect(nitroConfig.database.default!.options.database).toBe('testdb')

      // Verify options were copied, not referenced
      runtimeConfigOptions.connector.options.host = 'modified'
      expect(nitroConfig.database.default!.options.host).toBe('localhost')
    })

    it('should handle postgresql configuration correctly', () => {
      const nitroConfig: MockNitroConfig = {
        experimental: {},
        database: {}
      }

      const runtimeConfigOptions = {
        connector: {
          name: 'postgresql' as DatabaseType,
          options: {
            host: 'pg-host',
            port: 5432,
            user: 'postgres',
            password: 'pgpass',
            database: 'pgdb'
          }
        }
      }

      // Simulate the module's logic
      nitroConfig.experimental = nitroConfig.experimental || {}
      nitroConfig.experimental.database = true
      nitroConfig.database = nitroConfig.database || {}

      if (!nitroConfig.database.default) {
        const connectorOptions = { ...runtimeConfigOptions.connector.options }
        const nitroConnector = mapConnectorName(runtimeConfigOptions.connector.name)

        nitroConfig.database.default = {
          connector: nitroConnector,
          options: connectorOptions
        }
      }

      expect(nitroConfig.database.default!.connector).toBe('postgresql')
      expect(nitroConfig.database.default!.options.host).toBe('pg-host')
      expect(nitroConfig.database.default!.options.port).toBe(5432)
      expect(nitroConfig.database.default!.options.user).toBe('postgres')
      expect(nitroConfig.database.default!.options.password).toBe('pgpass')
      expect(nitroConfig.database.default!.options.database).toBe('pgdb')
    })
  })

  describe('Configuration Object Structure', () => {
    it('should maintain correct structure for sqlite configuration', () => {
      const runtimeConfigOptions = {
        connector: {
          name: 'sqlite' as DatabaseType,
          options: {
            path: './data/users.sqlite3'
          }
        }
      }

      const connectorOptions = { ...runtimeConfigOptions.connector.options }
      const nitroConnector = mapConnectorName(runtimeConfigOptions.connector.name)

      const databaseConfig = {
        connector: nitroConnector,
        options: connectorOptions
      }

      expect(databaseConfig).toEqual({
        connector: 'better-sqlite3',
        options: {
          path: './data/users.sqlite3'
        }
      })
    })

    it('should maintain correct structure for mysql configuration', () => {
      const runtimeConfigOptions = {
        connector: {
          name: 'mysql' as DatabaseType,
          options: {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'secret',
            database: 'myapp'
          }
        }
      }

      const connectorOptions = { ...runtimeConfigOptions.connector.options }
      const nitroConnector = mapConnectorName(runtimeConfigOptions.connector.name)

      const databaseConfig = {
        connector: nitroConnector,
        options: connectorOptions
      }

      expect(databaseConfig).toEqual({
        connector: 'mysql2',
        options: {
          host: 'localhost',
          port: 3306,
          user: 'root',
          password: 'secret',
          database: 'myapp'
        }
      })
    })
  })
})
