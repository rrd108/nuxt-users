import { defineCommand } from 'citty'
import { createPasswordResetTokensTable } from '../runtime/server/utils'
import { loadOptions } from './utils'

export default defineCommand({
  meta: {
    name: 'create-password-reset-tokens-table',
    description: 'Create the password reset tokens table in the database'
  },
  async run() {
    console.log('[Nuxt Users] Creating password reset tokens table...')

    const options = await loadOptions()

    try {
      await createPasswordResetTokensTable(options)
      console.log('[Nuxt Users] Password reset tokens table created successfully!')
    }
    catch (error) {
      console.error('[Nuxt Users] DB:Create Password Reset Tokens Table Error:', error)
      process.exit(1)
    }
  }
})
