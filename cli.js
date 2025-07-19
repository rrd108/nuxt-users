#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const command = process.argv[2]

if (!command) {
  console.error('Usage: nuxt-users <command> [args...]')
  console.error('Available commands:')
  console.error('  migrate - Run database migrations')
  console.error('  create-user <email> <name> <password> - Create a new user')
  console.error('  create-users-table - Create users table')
  console.error('  create-personal-access-tokens-table - Create personal access tokens table')
  console.error('  create-password-reset-tokens-table - Create password reset tokens table')
  console.error('  create-migrations-table - Create migrations table')
  process.exit(1)
}

const scriptMap = {
  'migrate': 'migrate.ts',
  'create-user': 'create-user.ts',
  'create-users-table': 'create-users-table.ts',
  'create-personal-access-tokens-table': 'create-personal-access-tokens-table.ts',
  'create-password-reset-tokens-table': 'create-password-reset-tokens-table.ts',
  'create-migrations-table': 'create-migrations-table.ts'
}

const scriptName = scriptMap[command]

if (!scriptName) {
  console.error(`Unknown command: ${command}`)
  process.exit(1)
}

const scriptPath = join(__dirname, 'src', 'cli', scriptName)

// Use tsx to run TypeScript files directly
const child = spawn('npx', ['tsx', scriptPath, ...process.argv.slice(3)], {
  stdio: 'inherit',
  cwd: process.cwd()
})

child.on('close', (code) => {
  process.exit(code)
})

child.on('error', (error) => {
  console.error(`Failed to execute ${command}:`, error)
  process.exit(1)
})
