import { defineCommand } from 'citty'
import { runMigrations } from '../utils'
import { getOptionsFromEnv } from './utils'

export default defineCommand({
  meta: {
    name: 'migrate',
    description: 'Run database migrations for the Nuxt Users module'
  },
  async run() {
    console.log('[Nuxt Users] Starting migration system...')

    const options = getOptionsFromEnv()

    try {
      await runMigrations(options)
      console.log('[Nuxt Users] Migration completed successfully!')
    }
    catch (error) {
      console.error('[Nuxt Users] Migration failed:', error)
      process.exit(1)
    }
  }
})
