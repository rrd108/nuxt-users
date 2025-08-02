import { defineCommand } from 'citty'
import { runMigrations } from '../runtime/server/utils'
import { loadOptions } from './utils'

export default defineCommand({
  meta: {
    name: 'migrate',
    description: 'Run database migrations for the Nuxt Users module'
  },
  async run() {
    console.log('[Nuxt Users] Starting migration system...')

    const options = await loadOptions()

    try {
      await runMigrations(options)
      console.log('[Nuxt Users] Migration completed successfully!')
      process.exit(0)
    }
    catch (error) {
      console.error('[Nuxt Users] Migration failed:', error)
      process.exit(1)
    }
  }
})
