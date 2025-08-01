import { createDatabase } from 'db0'
import type { ModuleOptions } from '../../../types'

export const getConnector = async (name: string) => {
  try {
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
  catch (error) {
    if (error instanceof Error && error.message.includes('Cannot resolve')) {
      throw new Error(`Database connector "${name}" not found. Please install the required peer dependency:\n`
        + '- For sqlite: yarn add better-sqlite3\n'
        + '- For mysql: yarn add mysql2\n'
        + '- For postgresql: yarn add pg')
    }
    throw error
  }
}

export const useDb = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)

  // Filter out path option for non-SQLite databases
  const connectorOptions = { ...options.connector!.options }
  if (connectorName !== 'sqlite') {
    delete connectorOptions.path
  }

  try {
    return createDatabase(connector(connectorOptions))
  }
  catch (error) {
    console.warn(`[Nuxt Users] ⚠️  Failed to connect to ${connectorName} database:`, error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

export const checkTableExists = async (options: ModuleOptions, tableName: string) => {
  try {
    const db = await useDb(options)
    await db.sql`SELECT 1 FROM {${tableName}} LIMIT 1`
    return true
  }
  catch {
    // Table doesn't exist or connection failed
    return false
  }
}
