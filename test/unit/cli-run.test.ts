import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'
import { readFileSync, existsSync, writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'node:fs'
import { join } from 'node:path'

describe('CLI: Package Imports', () => {
  beforeAll(() => {
    // Ensure the package is built before running these tests
    if (!existsSync('./dist/cli.mjs')) {
      throw new Error('Package must be built before running CLI import tests. Run "yarn build" first.')
    }
  })

  it('should be able to run npx nuxt-users project-info', async () => {
    // Test that the CLI can be executed via npx without module resolution errors
    // This simulates what happens in a consumer app

    try {
      const result = execSync('npx nuxt-users project-info', {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 10000 // 10 second timeout
      })

      // The command should run successfully without errors
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    }
    catch (error) {
      // If there's an error, it should not be a module resolution error
      if (error instanceof Error) {
        expect(error.message).not.toContain('ERR_MODULE_NOT_FOUND')
        expect(error.message).not.toContain('Cannot find module')
      }
      throw error
    }
  }, 15000) // 15 second timeout for the test

  it('should be able to run nuxt-users project-info', async () => {
    // Test that the CLI can be executed without module resolution errors
    // This simulates what happens in a consumer app

    try {
      const result = execSync('node ./dist/cli.mjs project-info', {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 10000 // 10 second timeout
      })

      // The command should run successfully without errors
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    }
    catch (error) {
      // If there's an error, it should not be a module resolution error
      if (error instanceof Error) {
        expect(error.message).not.toContain('ERR_MODULE_NOT_FOUND')
        expect(error.message).not.toContain('Cannot find module')
      }
      throw error
    }
  }, 15000) // 15 second timeout for the test

  it('should be able to run nuxt-users migrate (dry run)', async () => {
    // Test that the migrate command can be executed without module resolution errors
    // We'll use a non-existent database to avoid actual migration
    const testDbPath = './nonexistent.sqlite3'

    try {
      const result = execSync(`DB_CONNECTOR=sqlite DB_PATH=${testDbPath} node ./dist/cli.mjs migrate`, {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 10000 // 10 second timeout
      })

      // The command should run successfully without module resolution errors
      expect(result).toBeDefined()
    }
    catch (error) {
      // If there's an error, it should not be a module resolution error
      if (error instanceof Error) {
        expect(error.message).not.toContain('ERR_MODULE_NOT_FOUND')
        expect(error.message).not.toContain('Cannot find module')
        // It's okay to have database connection errors, but not module resolution errors
        expect(error.message).not.toContain('nuxt-users/dist/utils')
      }
      throw error
    }
    finally {
      // Clean up the test database file if it was created
      if (existsSync(testDbPath)) {
        unlinkSync(testDbPath)
      }
    }
  }, 15000) // 15 second timeout for the test

  it('should work in a simulated consumer app context', async () => {
    // This test simulates the exact scenario from a consumer app
    // Create a temporary directory to simulate a consumer app
    const tempDir = join(process.cwd(), 'temp-consumer-app')

    try {
      // Create temp directory
      mkdirSync(tempDir, { recursive: true })

      // Create a package.json for the consumer app
      const consumerPackageJson = {
        name: 'consumer-app',
        version: '1.0.0',
        type: 'module',
        dependencies: {
          'nuxt-users': 'file:../'
        }
      }

      writeFileSync(join(tempDir, 'package.json'), JSON.stringify(consumerPackageJson, null, 2))

      // Install the package (this simulates what happens in a real consumer app)
      execSync('pnpm install', { cwd: tempDir, stdio: 'pipe' })

      // Create a test script that tries to use the CLI via npx
      const testScript = `
        import { execSync } from 'child_process'
        
        try {
          // This simulates what happens when a consumer runs npx nuxt-users project-info
          const result = execSync('npx nuxt-users project-info', { 
            encoding: 'utf8',
            cwd: process.cwd()
          })
          console.log('SUCCESS:', result.trim())
        } catch (error) {
          console.error('ERROR:', error.message)
          process.exit(1)
        }
      `

      writeFileSync(join(tempDir, 'test-cli.mjs'), testScript)

      // Run the test script
      const result = execSync('node test-cli.mjs', {
        encoding: 'utf8',
        cwd: tempDir,
        timeout: 10000
      })

      // Should succeed without module resolution errors
      expect(result).toContain('SUCCESS:')
      expect(result).not.toContain('ERR_MODULE_NOT_FOUND')
      expect(result).not.toContain('Cannot find module')
    }
    finally {
      // Clean up
      if (existsSync(tempDir)) {
        if (existsSync(join(tempDir, 'test-cli.mjs'))) {
          unlinkSync(join(tempDir, 'test-cli.mjs'))
        }
        if (existsSync(join(tempDir, 'package.json'))) {
          unlinkSync(join(tempDir, 'package.json'))
        }
        // Remove node_modules and pnpm-lock.yaml
        if (existsSync(join(tempDir, 'node_modules'))) {
          execSync('rm -rf node_modules', { cwd: tempDir })
        }
        if (existsSync(join(tempDir, 'pnpm-lock.yaml'))) {
          unlinkSync(join(tempDir, 'pnpm-lock.yaml'))
        }
        rmdirSync(tempDir)
      }
    }
  }, 30000) // 30 second timeout for the test

  it('should have correct exports in package.json', () => {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

    expect(packageJson.exports).toBeDefined()
    expect(packageJson.exports['.']).toBeDefined()
    expect(packageJson.exports['./utils']).toBeDefined()

    // Check that the export paths point to existing files
    expect(existsSync(packageJson.exports['.'].import.replace('./dist/', './dist/'))).toBe(true)
    expect(existsSync(packageJson.exports['./utils'].import.replace('./dist/', './dist/'))).toBe(true)
  })

  it('should have CLI binary in package.json', () => {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

    expect(packageJson.bin).toBeDefined()
    expect(packageJson.bin['nuxt-users']).toBeDefined()
    expect(existsSync(packageJson.bin['nuxt-users'])).toBe(true)
  })
})
