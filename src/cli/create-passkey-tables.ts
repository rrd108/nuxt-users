import { defineCommand } from 'citty'
import { createPasskeyTables } from '../runtime/server/utils/create-passkey-tables'
import { loadOptions } from './utils'

export default defineCommand({
  meta: {
    name: 'create-passkey-tables',
    description: 'Create the passkeys and passkey challenges tables in the database'
  },
  async run() {
    console.log('[Nuxt Users] Creating passkey tables...')

    const options = await loadOptions()

    try {
      await createPasskeyTables(options)
      console.log('[Nuxt Users] Passkey tables created successfully!')
    }
    catch (error) {
      console.error('[Nuxt Users] DB:Create Passkey Tables Error:', error)
      process.exit(1)
    }
  }
})
