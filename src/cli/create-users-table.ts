import { defineCommand } from 'citty'
import { createUsersTable } from 'nuxt-users'
import { loadOptions } from './utils'

export default defineCommand({
  meta: {
    name: 'create-users-table',
    description: 'Create the users table in the database'
  },
  async run() {
    console.log('[Nuxt Users] Creating users table...')

    const options = await loadOptions()

    try {
      await createUsersTable(options)
      console.log('[Nuxt Users] Users table created successfully!')
    }
    catch (error) {
      console.error('[Nuxt Users] DB:Create Users Table Error:', error)
      process.exit(1)
    }
  }
})
