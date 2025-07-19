import { defineCommand } from 'citty'
import { createPersonalAccessTokensTable } from '../runtime/server/utils/create-personal-access-tokens-table'
import { getOptionsFromEnv } from './utils'

export default defineCommand({
  meta: {
    name: 'create-personal-access-tokens-table',
    description: 'Create the personal access tokens table in the database'
  },
  async run() {
    console.log('[Nuxt Users] Creating personal access tokens table...')

    const options = getOptionsFromEnv()

    try {
      await createPersonalAccessTokensTable(options)
      console.log('[Nuxt Users] Personal access tokens table created successfully!')
    }
    catch (error) {
      console.error('[DB:Create Personal Access Tokens Table] Error:', error)
      process.exit(1)
    }
  }
})
