import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'

// Schema inspection that never throws for a missing table/column/index.
// A failing probe (e.g. `SELECT col FROM missing_table`) would abort an open PostgreSQL transaction,
// so these query the catalog instead.

// PostgreSQL folds unquoted identifiers to lower case, and table names are interpolated unquoted
const catalogName = (options: ModuleOptions, name: string) =>
  options.connector!.name === 'postgresql' ? name.toLowerCase() : name

export const tableExists = async (options: ModuleOptions, tableName: string): Promise<boolean> => {
  const db = await useDb(options)
  const name = catalogName(options, tableName)
  const connectorName = options.connector!.name

  if (connectorName === 'sqlite') {
    const result = await db.sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ${name}` as { rows: unknown[] }
    return result.rows.length > 0
  }
  if (connectorName === 'mysql') {
    const result = await db.sql`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ${name}` as { rows: unknown[] }
    return result.rows.length > 0
  }
  const result = await db.sql`SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ${name}` as { rows: unknown[] }
  return result.rows.length > 0
}

export const columnExists = async (options: ModuleOptions, tableName: string, columnName: string): Promise<boolean> => {
  const db = await useDb(options)
  const name = catalogName(options, tableName)
  const column = catalogName(options, columnName)
  const connectorName = options.connector!.name

  if (connectorName === 'sqlite') {
    const result = await db.sql`SELECT name FROM pragma_table_info(${name}) WHERE name = ${column}` as { rows: unknown[] }
    return result.rows.length > 0
  }
  if (connectorName === 'mysql') {
    const result = await db.sql`SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ${name} AND column_name = ${column}` as { rows: unknown[] }
    return result.rows.length > 0
  }
  const result = await db.sql`SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ${name} AND column_name = ${column}` as { rows: unknown[] }
  return result.rows.length > 0
}

export const indexExists = async (options: ModuleOptions, tableName: string, indexName: string): Promise<boolean> => {
  const db = await useDb(options)
  const name = catalogName(options, tableName)
  const index = catalogName(options, indexName)
  const connectorName = options.connector!.name

  if (connectorName === 'sqlite') {
    const result = await db.sql`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ${name} AND name = ${index}` as { rows: unknown[] }
    return result.rows.length > 0
  }
  if (connectorName === 'mysql') {
    const result = await db.sql`SELECT index_name FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ${name} AND index_name = ${index}` as { rows: unknown[] }
    return result.rows.length > 0
  }
  const result = await db.sql`SELECT indexname FROM pg_indexes WHERE schemaname = current_schema() AND tablename = ${name} AND indexname = ${index}` as { rows: unknown[] }
  return result.rows.length > 0
}

export const assertTableExists = async (options: ModuleOptions, tableName: string) => {
  if (!await tableExists(options, tableName)) {
    throw new Error(`[Nuxt Users] Expected table "${tableName}" to exist after migration, but it does not`)
  }
}

export const assertColumnsExist = async (options: ModuleOptions, tableName: string, columns: string[]) => {
  for (const column of columns) {
    if (!await columnExists(options, tableName, column)) {
      throw new Error(`[Nuxt Users] Expected column "${tableName}.${column}" to exist after migration, but it does not`)
    }
  }
}

export const assertIndexExists = async (options: ModuleOptions, tableName: string, indexName: string) => {
  if (!await indexExists(options, tableName, indexName)) {
    throw new Error(`[Nuxt Users] Expected index "${indexName}" on "${tableName}" to exist after migration, but it does not`)
  }
}
