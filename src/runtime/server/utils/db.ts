import { createDatabase } from 'db0'
import type { ModuleOptions } from '../../../types'

export const getConnector = async (name: string) => {
  switch (name) {
    case 'mysql':
      return (await import('db0/connectors/mysql2')).default
    case 'postgresql':
      return (await import('db0/connectors/postgresql')).default
    case 'sqlite':
      return (await import('db0/connectors/better-sqlite3')).default
    default:
      throw new Error(`Unsupported database connector: ${name}`)
  }
}

const useDb = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)

  return createDatabase(connector(options.connector!.options))
}

// TODO remove this
export const checkPasswordResetTokensTableExists = async (options: ModuleOptions) => {
  return await checkTableExists(options, options.tables.passwordResetTokens)
}

// TODO remove this
export const checkUsersTableExists = async (options: ModuleOptions) => {
  return await checkTableExists(options, options.tables.users)
}

// TODO remove this
export const checkPersonalAccessTokensTableExists = async (options: ModuleOptions) => {
  return await checkTableExists(options, options.tables.personalAccessTokens)
}

export const checkTableExists = async (options: ModuleOptions, tableName: string) => {
  const db = await useDb(options)
  try {
    await db.sql`SELECT 1 FROM {${tableName}} LIMIT 1`
    return true
  }
  catch {
    return false
  }
}

interface CountResult {
  rows: Array<{ count: number }>
}

export const hasAnyUsers = async (options: ModuleOptions) => {
  const db = await useDb(options)

  try {
    const users = await db.sql`SELECT COUNT(*) as count FROM {${options.tables.users}}` as CountResult
    return users.rows?.[0]?.count > 0
  }
  catch {
    // If the table doesn't exist, there are no users
    return false
  }
}
