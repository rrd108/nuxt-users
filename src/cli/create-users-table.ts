import { defineCommand } from 'citty'
import { createUsersTable } from '../runtime/server/utils/create-users-table'
import { getOptionsFromEnv } from './utils'

export default defineCommand({
  meta: {
    name: 'create-users-table',
    description: 'Create the users table in the database'
  },
  async run() {
    console.log('[Nuxt Users] Creating users table...')

    const options = getOptionsFromEnv()

    try {
      await createUsersTable(options)
      console.log('[Nuxt Users] Users table created successfully!')
    }
    catch (error) {
      console.error('[DB:Create Users Table] Error:', error)
      process.exit(1)
    }
  }
})
