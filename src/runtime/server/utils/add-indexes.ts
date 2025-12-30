import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'

export const addActiveIndexToUsers = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const tableName = options.tables.users

  console.log(`[Nuxt Users] DB:Add active index to ${connectorName} Users Table in ${tableName}...`)

  await db.sql`CREATE INDEX IF NOT EXISTS idx_users_active ON {${tableName}} (active)`

  console.log(`[Nuxt Users] DB:Add active index to ${connectorName} Users Table ✅`)
}

export const addTokenableIndexToPersonalAccessTokens = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)
  const tableName = options.tables.personalAccessTokens

  console.log(`[Nuxt Users] DB:Add tokenable index to ${connectorName} Personal Access Tokens Table in ${tableName}...`)

  await db.sql`CREATE INDEX IF NOT EXISTS idx_personal_access_tokens_tokenable ON {${tableName}} (tokenable_type, tokenable_id)`

  console.log(`[Nuxt Users] DB:Add tokenable index to ${connectorName} Personal Access Tokens Table ✅`)
}
