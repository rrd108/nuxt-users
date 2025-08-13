import { defineCommand } from 'citty'
import { addActiveToUsers } from '../runtime/server/utils/add-active-to-users'
import { loadOptions } from './utils'

export default defineCommand({
  meta: {
    name: 'add-active-to-users',
    description: 'Add the active field to the users table in the database'
  },
  async run() {
    console.log('[Nuxt Users] Adding active field to users table...')

    const options = await loadOptions()

    try {
      await addActiveToUsers(options)
      console.log('[Nuxt Users] Active field added to users table successfully!')
    }
    catch (error) {
      console.error('[Nuxt Users] DB:Add Active to Users Error:', error)
      process.exit(1)
    }
  }
})
