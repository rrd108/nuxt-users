#!/usr/bin/env node
import { defineCommand, runMain } from 'citty'
import { readFileSync } from 'node:fs'
import migrate from './migrate'
import createUser from './create-user'
import createUsersTable from './create-users-table'
import createPersonalAccessTokensTable from './create-personal-access-tokens-table'
import createPasswordResetTokensTable from './create-password-reset-tokens-table'
import createMigrationsTable from './create-migrations-table'
import addActiveToUsers from './add-active-to-users'
import addGoogleOauthFields from './add-google-oauth-fields'
import projectInfo from './project-info'

// Dynamically load version from package.json at runtime
const getVersion = () => {
  try {
    // Read from the nuxt-users package.json (one level up from dist/cli.mjs)
    const packagePath = new URL('../package.json', import.meta.url)
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
    return packageJson.version
  }
  catch {
    return 'unknown'
  }
}

const main = defineCommand({
  meta: {
    name: 'nuxt-users',
    description: 'CLI for Nuxt Users Module - Manage users, migrations, and database operations',
    version: getVersion()
  },
  subCommands: {
    migrate,
    'create-user': createUser,
    'create-users-table': createUsersTable,
    'create-personal-access-tokens-table': createPersonalAccessTokensTable,
    'create-password-reset-tokens-table': createPasswordResetTokensTable,
    'create-migrations-table': createMigrationsTable,
    'add-active-to-users': addActiveToUsers,
    'add-google-oauth-fields': addGoogleOauthFields,
    'project-info': projectInfo
  }
})

runMain(main)
