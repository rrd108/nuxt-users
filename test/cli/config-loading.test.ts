/**
 * CLI Configuration Loading Tests
 *
 * This test suite validates the configuration loading functionality for CLI commands
 * like 'npx nuxt-users migrate'. It ensures that:
 *
 * 1. Environment variables are properly parsed for database configuration
 * 2. Top-level nuxtUsers configuration is loaded correctly
 * 3. Runtime config (runtimeConfig.nuxtUsers) is loaded correctly
 * 4. Configuration merging works properly with correct precedence
 * 5. Connector configurations don't get mixed (regression test for the bug where
 *    MySQL config was being mixed with SQLite defaults)
 *
 * The tests cover various scenarios including zero-config, partial config,
 * malformed config, and mixed configurations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadOptions, getOptionsFromEnv } from '../../src/cli/utils'
import { defaultOptions } from '../../src/module'
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

describe('CLI: Configuration Loading', () => {
  const testDir = join(process.cwd(), 'test-config-loading')
  const configPath = join(testDir, 'nuxt.config.ts')

  beforeEach(() => {
    // Create test directory
    mkdirSync(testDir, { recursive: true })

    // Change to test directory for CLI tests
    process.chdir(testDir)
  })

  afterEach(() => {
    // Change back to original directory
    process.chdir(join(testDir, '..'))

    // Clean up test files
    if (existsSync(configPath)) {
      unlinkSync(configPath)
    }
    if (existsSync(testDir)) {
      try {
        // Remove directory and contents
        execSync(`rm -rf "${testDir}"`)
      }
      catch {
        // Ignore cleanup errors
      }
    }
  })

  describe('getOptionsFromEnv', () => {
    beforeEach(() => {
      // Clear any existing environment variables
      delete process.env.DB_CONNECTOR
      delete process.env.DB_PATH
      delete process.env.DB_HOST
      delete process.env.DB_PORT
      delete process.env.DB_USER
      delete process.env.DB_PASSWORD
      delete process.env.DB_NAME
    })

    it('should return default SQLite configuration when no env vars are set', () => {
      const options = getOptionsFromEnv()

      expect(options.connector.name).toBe('sqlite')
      expect(options.connector.options.path).toBe('./data/users.sqlite3')
      expect(options.tables).toEqual(defaultOptions.tables)
    })

    it('should use custom SQLite path from environment', () => {
      process.env.DB_CONNECTOR = 'sqlite'
      process.env.DB_PATH = './custom.sqlite3'

      const options = getOptionsFromEnv()

      expect(options.connector.name).toBe('sqlite')
      expect(options.connector.options.path).toBe('./custom.sqlite3')
    })

    it('should configure MySQL from environment variables', () => {
      process.env.DB_CONNECTOR = 'mysql'
      process.env.DB_HOST = 'localhost'
      process.env.DB_PORT = '3306'
      process.env.DB_USER = 'testuser'
      process.env.DB_PASSWORD = 'testpass'
      process.env.DB_NAME = 'testdb'

      const options = getOptionsFromEnv()

      expect(options.connector.name).toBe('mysql')
      expect(options.connector.options).toEqual({
        host: 'localhost',
        port: 3306,
        user: 'testuser',
        password: 'testpass',
        database: 'testdb'
      })
    })

    it('should configure PostgreSQL from environment variables', () => {
      process.env.DB_CONNECTOR = 'postgresql'
      process.env.DB_HOST = 'localhost'
      process.env.DB_PORT = '5432'
      process.env.DB_USER = 'postgres'
      process.env.DB_PASSWORD = 'pgpass'
      process.env.DB_NAME = 'pgdb'

      const options = getOptionsFromEnv()

      expect(options.connector.name).toBe('postgresql')
      expect(options.connector.options).toEqual({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'pgpass',
        database: 'pgdb'
      })
    })

    it('should throw error for unsupported database connector', () => {
      process.env.DB_CONNECTOR = 'unsupported'

      expect(() => getOptionsFromEnv()).toThrow('Unsupported database connector: unsupported')
    })
  })

  describe('loadOptions', () => {
    it('should fall back to environment variables when no Nuxt project exists', async () => {
      // No nuxt.config.ts file exists
      process.env.DB_CONNECTOR = 'sqlite'
      process.env.DB_PATH = './env-fallback.sqlite3'

      const options = await loadOptions()

      expect(options.connector.name).toBe('sqlite')
      expect(options.connector.options.path).toBe('./env-fallback.sqlite3')
    })

    it('should load top-level nuxtUsers configuration', async () => {
      // Create nuxt.config.ts with top-level nuxtUsers config
      const configContent = `
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    connector: {
      name: 'mysql' as const,
      options: {
        host: 'mysql-host',
        port: 3306,
        user: 'mysql-user',
        password: 'mysql-pass',
        database: 'mysql-db'
      }
    },
    auth: {
      tokenExpiration: 60
    }
  }
})
`
      writeFileSync(configPath, configContent)

      const options = await loadOptions()

      expect(options.connector.name).toBe('mysql')
      expect(options.connector.options).toEqual({
        host: 'mysql-host',
        port: 3306,
        user: 'mysql-user',
        password: 'mysql-pass',
        database: 'mysql-db'
      })
      expect(options.auth.tokenExpiration).toBe(60)
    })

    it('should load runtime config nuxtUsers configuration', async () => {
      // Create nuxt.config.ts with runtime config (like the user's setup)
      const configContent = `
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  runtimeConfig: {
    nuxtUsers: {
      connector: {
        name: 'mysql' as const,
        options: {
          host: 'runtime-mysql-host',
          port: 3306,
          user: 'runtime-mysql-user',
          password: 'runtime-mysql-pass',
          database: 'runtime-mysql-db'
        }
      },
      auth: {
        tokenExpiration: 120
      }
    }
  }
})
`
      writeFileSync(configPath, configContent)

      const options = await loadOptions()

      expect(options.connector.name).toBe('mysql')
      expect(options.connector.options).toEqual({
        host: 'runtime-mysql-host',
        port: 3306,
        user: 'runtime-mysql-user',
        password: 'runtime-mysql-pass',
        database: 'runtime-mysql-db'
      })
      expect(options.auth.tokenExpiration).toBe(120)
    })

    it('should prioritize top-level config over runtime config', async () => {
      // Create nuxt.config.ts with both top-level and runtime config
      const configContent = `
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    connector: {
      name: 'postgresql' as const,
      options: {
        host: 'top-level-host',
        port: 5432,
        user: 'top-level-user',
        password: 'top-level-pass',
        database: 'top-level-db'
      }
    },
    auth: {
      tokenExpiration: 30
    }
  },
  runtimeConfig: {
    nuxtUsers: {
      connector: {
        name: 'mysql' as const,
        options: {
          host: 'runtime-host',
          port: 3306,
          user: 'runtime-user',
          password: 'runtime-pass',
          database: 'runtime-db'
        }
      },
      auth: {
        tokenExpiration: 60
      }
    }
  }
})
`
      writeFileSync(configPath, configContent)

      const options = await loadOptions()

      // Top-level config should take priority
      expect(options.connector.name).toBe('postgresql')
      expect(options.connector.options).toEqual({
        host: 'top-level-host',
        port: 5432,
        user: 'top-level-user',
        password: 'top-level-pass',
        database: 'top-level-db'
      })
      expect(options.auth.tokenExpiration).toBe(30)
    })

    it('should merge configurations with defaults properly', async () => {
      // Create nuxt.config.ts with partial configuration
      const configContent = `
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  runtimeConfig: {
    nuxtUsers: {
      connector: {
        name: 'mysql' as const,
        options: {
          host: 'test-host',
          port: 3306,
          user: 'test-user',
          password: 'test-pass',
          database: 'test-db'
        }
      }
      // Missing other config like auth, tables, etc.
    }
  }
})
`
      writeFileSync(configPath, configContent)

      const options = await loadOptions()

      // Should have our custom connector
      expect(options.connector.name).toBe('mysql')
      expect(options.connector.options).toEqual({
        host: 'test-host',
        port: 3306,
        user: 'test-user',
        password: 'test-pass',
        database: 'test-db'
      })

      // Should have defaults for missing config
      expect(options.tables).toEqual(defaultOptions.tables)
      expect(options.auth.tokenExpiration).toBe(defaultOptions.auth.tokenExpiration)
      expect(options.apiBasePath).toBe(defaultOptions.apiBasePath)
      expect(options.passwordValidation).toEqual(defaultOptions.passwordValidation)
    })

    it('should not mix connector configurations (regression test for the bug)', async () => {
      // This is the specific test case that would have caught the original bug
      const configContent = `
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  runtimeConfig: {
    nuxtUsers: {
      connector: {
        name: 'mysql' as const,
        options: {
          host: process.env.NUXT_MYSQL_HOST,
          port: 3306,
          user: process.env.NUXT_MYSQL_USER,
          password: process.env.NUXT_MYSQL_PASSWORD,
          database: process.env.NUXT_MYSQL_DATABASE
        }
      }
    }
  }
})
`
      writeFileSync(configPath, configContent)

      // Set environment variables like in the user's scenario
      process.env.NUXT_MYSQL_HOST = 'localhost'
      process.env.NUXT_MYSQL_USER = 'myuser'
      process.env.NUXT_MYSQL_PASSWORD = 'mypass'
      process.env.NUXT_MYSQL_DATABASE = 'mydb'

      const options = await loadOptions()

      // CRITICAL: Should NOT have sqlite defaults mixed in
      expect(options.connector.name).toBe('mysql')
      expect(options.connector.options.path).toBeUndefined() // SQLite path should not exist

      // Should have proper MySQL config
      expect(options.connector.options.host).toBe('localhost')
      expect(options.connector.options.port).toBe(3306)
      expect(options.connector.options.user).toBe('myuser')
      expect(options.connector.options.password).toBe('mypass')
      expect(options.connector.options.database).toBe('mydb')

      // Clean up env vars
      delete process.env.NUXT_MYSQL_HOST
      delete process.env.NUXT_MYSQL_USER
      delete process.env.NUXT_MYSQL_PASSWORD
      delete process.env.NUXT_MYSQL_DATABASE
    })

    it('should handle malformed nuxt.config.ts gracefully', async () => {
      // Create malformed config file
      const configContent = `
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  // Malformed syntax
  invalidProperty: {
    this is not valid javascript
  }
})
`
      writeFileSync(configPath, configContent)

      // Set environment fallback
      process.env.DB_CONNECTOR = 'sqlite'
      process.env.DB_PATH = './fallback.sqlite3'

      const options = await loadOptions()

      // Should fall back to environment variables
      expect(options.connector.name).toBe('sqlite')
      expect(options.connector.options.path).toBe('./fallback.sqlite3')
    })
  })

  describe('Configuration scenarios', () => {
    it('should handle zero-config scenario (no config file, no env vars)', async () => {
      // Clear all environment variables to ensure clean state
      delete process.env.DB_CONNECTOR
      delete process.env.DB_PATH
      delete process.env.DB_HOST
      delete process.env.DB_PORT
      delete process.env.DB_USER
      delete process.env.DB_PASSWORD
      delete process.env.DB_NAME

      // No config file, no env vars - should use complete defaults
      const options = await loadOptions()

      expect(options).toEqual(defaultOptions)
    })

    it('should handle mixed partial configurations', async () => {
      // Top-level has connector, runtime has auth settings
      const configContent = `
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    connector: {
      name: 'postgresql' as const,
      options: {
        host: 'pg-host',
        port: 5432,
        user: 'pguser',
        password: 'pgpass',
        database: 'pgdb'
      }
    }
  },
  runtimeConfig: {
    nuxtUsers: {
      auth: {
        tokenExpiration: 240,
        whitelist: ['/public', '/api/health']
      },
      tables: {
        users: 'custom_users',
        migrations: 'custom_migrations'
      }
    }
  }
})
`
      writeFileSync(configPath, configContent)

      const options = await loadOptions()

      // Should get connector from top-level
      expect(options.connector.name).toBe('postgresql')
      expect(options.connector.options.host).toBe('pg-host')

      // Should get auth from runtime config
      expect(options.auth.tokenExpiration).toBe(240)
      expect(options.auth.whitelist).toEqual(['/public', '/api/health'])

      // Should get tables from runtime config
      expect(options.tables.users).toBe('custom_users')
      expect(options.tables.migrations).toBe('custom_migrations')

      // Should get defaults for unspecified values
      expect(options.tables.personalAccessTokens).toBe(defaultOptions.tables.personalAccessTokens)
      expect(options.apiBasePath).toBe(defaultOptions.apiBasePath)
    })
  })
})
