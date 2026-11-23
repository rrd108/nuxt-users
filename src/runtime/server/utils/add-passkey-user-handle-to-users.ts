import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'
import { columnExists } from './schema'

/**
 * Gives every user one WebAuthn user handle that outlives their passkeys, so a passkey registered after
 * all others were deleted replaces the stale one on the device instead of sitting next to it (issue #235).
 * Users who already have passkeys keep the handle of their oldest one; the others get one on their first registration.
 */
export const addPasskeyUserHandleToUsers = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const usersTable = options.tables.users
  const passkeysTable = options.tables.passkeys

  console.log(`[Nuxt Users] DB:Add passkey_user_handle to ${connectorName} Users Table in ${usersTable}...`)

  if (await columnExists(options, usersTable, 'passkey_user_handle')) {
    console.log('[Nuxt Users] passkey_user_handle column already exists')
  }
  else if (connectorName === 'sqlite') {
    await db.sql`ALTER TABLE {${usersTable}} ADD COLUMN passkey_user_handle TEXT`
  }
  else {
    await db.sql`ALTER TABLE {${usersTable}} ADD COLUMN passkey_user_handle VARCHAR(255) NULL`
  }

  await db.sql`
    UPDATE {${usersTable}} SET passkey_user_handle = (
      SELECT p.user_handle FROM {${passkeysTable}} p WHERE p.user_id = {${usersTable}}.id ORDER BY p.id LIMIT 1
    )
    WHERE passkey_user_handle IS NULL
  `

  console.log(`[Nuxt Users] DB:Add passkey_user_handle to ${connectorName} Users Table ✅`)
}
