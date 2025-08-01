#!/usr/bin/env node
import { defineCommand, runMain } from 'citty'
import migrate from './migrate'
import createUser from './create-user'
import createUsersTable from './create-users-table'
import createPersonalAccessTokensTable from './create-personal-access-tokens-table'
import createPasswordResetTokensTable from './create-password-reset-tokens-table'
import createMigrationsTable from './create-migrations-table'
import projectInfo from './project-info'

const main = defineCommand({
  meta: {
    name: 'nuxt-users',
    description: 'CLI for Nuxt Users Module - Manage users, migrations, and database operations',
    version: '1.6.5'
  },
  subCommands: {
    migrate,
    'create-user': createUser,
    'create-users-table': createUsersTable,
    'create-personal-access-tokens-table': createPersonalAccessTokensTable,
    'create-password-reset-tokens-table': createPasswordResetTokensTable,
    'create-migrations-table': createMigrationsTable,
    'project-info': projectInfo
  }
})

runMain(main)
