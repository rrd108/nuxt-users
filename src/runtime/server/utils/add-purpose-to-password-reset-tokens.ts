import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'
import { columnExists } from './schema'

/**
 * Gives every email token a purpose, so a password reset token can never confirm an email or the
 * other way round (docs/adr/0001-email-token-storage.md). Tokens issued before this migration get
 * their purpose from the user's state: an inactive user's token is taken to be a confirmation token.
 */
export const addPurposeToPasswordResetTokens = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const tableName = options.tables.passwordResetTokens
  const usersTable = options.tables.users

  console.log(`[Nuxt Users] DB:Add purpose to ${connectorName} Password Reset Tokens Table in ${tableName}...`)

  // Newer token tables are created with the column; only add it when missing
  if (await columnExists(options, tableName, 'purpose')) {
    console.log('[Nuxt Users] purpose column already exists')
  }
  else if (connectorName === 'sqlite') {
    await db.sql`ALTER TABLE {${tableName}} ADD COLUMN purpose TEXT`
  }
  else {
    await db.sql`ALTER TABLE {${tableName}} ADD COLUMN purpose VARCHAR(32) NULL`
  }

  await db.sql`
    UPDATE {${tableName}} SET purpose = 'email_confirmation'
    WHERE purpose IS NULL AND email IN (SELECT email FROM {${usersTable}} WHERE active = FALSE)
  `
  await db.sql`UPDATE {${tableName}} SET purpose = 'password_reset' WHERE purpose IS NULL`

  console.log(`[Nuxt Users] DB:Add purpose to ${connectorName} Password Reset Tokens Table ✅`)
}
