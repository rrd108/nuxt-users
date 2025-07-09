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

export const checkUsersTableExists = async (options: ModuleOptions) => {
  const db = await useDb(options)

  try {
    // Try to query the users table - if it exists, this will succeed
    await db.sql`SELECT 1 FROM users LIMIT 1`
    return true
  }
  catch {
    // If the table doesn't exist, the query will fail
    return false
  }
}

interface CountResult {
  rows: Array<{ count: number }>
}

export const hasAnyUsers = async (options: ModuleOptions) => {
  const db = await useDb(options)

  try {
    const users = await db.sql`SELECT COUNT(*) as count FROM users` as CountResult
    return users.rows?.[0]?.count > 0
  }
  catch {
    // If the table doesn't exist, there are no users
    return false
  }
}
