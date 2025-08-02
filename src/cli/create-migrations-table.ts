import { defineCommand } from 'citty'
import { createMigrationsTable } from '../runtime/server/utils'
import { loadOptions } from './utils'

export default defineCommand({
  meta: {
    name: 'create-migrations-table',
    description: 'Create the migrations table in the database'
  },
  async run() {
    console.log('[Nuxt Users] Creating migrations table...')

    const options = await loadOptions()

    try {
      await createMigrationsTable(options)
      console.log('[Nuxt Users] Migrations table created successfully!')
    }
    catch (error) {
      console.error('[Nuxt Users] DB:Create Migrations Table Error:', error)
      process.exit(1)
    }
  }
})
