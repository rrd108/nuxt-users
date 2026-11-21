import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'
import { columnExists } from './schema'

/**
 * Registration challenges carry the WebAuthn user handle sent to the authenticator, so the passkey is
 * saved with that same handle (see issue #224).
 */
export const addUserHandleToPasskeyChallenges = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const tableName = options.tables.passkeyChallenges

  console.log(`[Nuxt Users] DB:Add user_handle to ${connectorName} Passkey Challenges Table in ${tableName}...`)

  // Newer challenge tables are created with the column; only add it when missing
  if (await columnExists(options, tableName, 'user_handle')) {
    console.log('[Nuxt Users] user_handle column already exists')
    return
  }

  if (connectorName === 'sqlite') {
    await db.sql`ALTER TABLE {${tableName}} ADD COLUMN user_handle TEXT`
  }
  else {
    await db.sql`ALTER TABLE {${tableName}} ADD COLUMN user_handle VARCHAR(255) NULL`
  }

  console.log(`[Nuxt Users] DB:Add user_handle to ${connectorName} Passkey Challenges Table ✅`)
}
