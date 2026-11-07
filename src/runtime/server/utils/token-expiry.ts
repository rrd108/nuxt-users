import type { Database } from 'db0'

/**
 * A DB timestamp as returned by the driver: a Date (MySQL, PostgreSQL)
 * or a 'YYYY-MM-DD HH:MM:SS' string (SQLite).
 */
export type DbTimestamp = Date | string

const toMilliseconds = (value: DbTimestamp): number => {
  if (value instanceof Date) {
    return value.getTime()
  }
  if (typeof value !== 'string') {
    return Number.NaN
  }
  // Both values come from the same driver, so treating zone-less strings as UTC cancels out
  return Date.parse(`${value.replace(' ', 'T')}Z`)
}

/**
 * Decides whether a token is older than `hours`.
 *
 * `dbNow` must be the database's own CURRENT_TIMESTAMP, read in the same query as `createdAt`:
 * both values then share the database's and the driver's time zone handling, so the difference
 * is correct whatever time zones the database and the Node process use.
 */
export const isTokenExpired = (createdAt: DbTimestamp, dbNow: DbTimestamp, hours: number): boolean => {
  const ageMs = toMilliseconds(dbNow) - toMilliseconds(createdAt)
  // An unparseable timestamp gives NaN: fail closed
  if (Number.isNaN(ageMs)) {
    return true
  }
  return ageMs > hours * 60 * 60 * 1000
}

/** A row of the password reset / confirmation token table, with the database's own clock alongside */
export interface TokenRecord {
  id: number
  email: string
  token: string
  created_at: DbTimestamp
  db_now: DbTimestamp
}

/**
 * Finds the tokens for an email, newest first. `db_now` is read in the same query so that
 * expiry can be judged on the database's own clock with `isTokenExpired` (issue #220).
 */
export const findTokenRecordsByEmail = async (db: Database, table: string, email: string): Promise<TokenRecord[]> => {
  const result = await db.sql`
    SELECT *, CURRENT_TIMESTAMP AS db_now FROM {${table}}
    WHERE email = ${email}
    ORDER BY created_at DESC
  ` as { rows: TokenRecord[] }
  return result.rows
}
