import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useDb } from './db'

/**
 * Email token module: the single-use, time-limited secrets sent in email links (see GLOSSARY.md).
 * Every token has exactly one purpose and is only ever accepted for it (docs/adr/0001-email-token-storage.md).
 */
export type EmailTokenPurpose = 'password_reset' | 'email_confirmation'

/** How long a token of each purpose stays valid */
export const EMAIL_TOKEN_TTL_HOURS: Record<EmailTokenPurpose, number> = {
  password_reset: 1,
  email_confirmation: 24
}

/**
 * A DB timestamp as returned by the driver: a Date (MySQL, PostgreSQL)
 * or a 'YYYY-MM-DD HH:MM:SS' string (SQLite).
 */
type DbTimestamp = Date | string

interface EmailTokenRow {
  id: number
  token: string
  purpose: EmailTokenPurpose | null
  created_at: DbTimestamp
  db_now: DbTimestamp
}

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
 * Decides whether a token is older than `hours`. Internal seam of this module, exported for its own tests.
 *
 * `dbNow` must be the database's own CURRENT_TIMESTAMP, read in the same query as `createdAt`:
 * both values then share the database's and the driver's time zone handling, so the difference
 * is correct whatever time zones the database and the Node process use (issue #220).
 */
export const isTokenExpired = (createdAt: DbTimestamp, dbNow: DbTimestamp, hours: number): boolean => {
  const ageMs = toMilliseconds(dbNow) - toMilliseconds(createdAt)
  // An unparseable timestamp gives NaN: fail closed
  if (Number.isNaN(ageMs)) {
    return true
  }
  return ageMs > hours * 60 * 60 * 1000
}

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

const affectedRows = (result: unknown): number => {
  const { changes, affectedRows, rowCount } = result as { changes?: number, affectedRows?: number, rowCount?: number }
  return Number(changes ?? affectedRows ?? rowCount ?? 0)
}

/**
 * Issues a new token for the email and purpose and returns its plain value for the email link.
 * Any older token of the same purpose for that email stops working: only the newest link is valid.
 */
export const issueEmailToken = async (email: string, purpose: EmailTokenPurpose, options: ModuleOptions): Promise<string> => {
  const db = await useDb(options)
  const table = options.tables.passwordResetTokens

  const token = crypto.randomBytes(32).toString('hex')

  await db.sql`DELETE FROM {${table}} WHERE email = ${email} AND purpose = ${purpose}`
  await db.sql`
    INSERT INTO {${table}} (email, token, purpose, created_at)
    VALUES (${email}, ${hashToken(token)}, ${purpose}, CURRENT_TIMESTAMP)
  `
  return token
}

/**
 * Tokens issued before SHA-256 hashing were bcrypt hashes, which can only be found by comparing.
 * They expire within 24 hours of the upgrade; this fallback can then be removed (docs/adr/0001-email-token-storage.md).
 */
const findLegacyToken = async (email: string, token: string, purpose: EmailTokenPurpose, options: ModuleOptions): Promise<EmailTokenRow | undefined> => {
  const db = await useDb(options)
  const table = options.tables.passwordResetTokens

  const result = await db.sql`
    SELECT id, token, purpose, created_at, CURRENT_TIMESTAMP AS db_now FROM {${table}}
    WHERE email = ${email} AND purpose = ${purpose} AND token LIKE ${'$2%'}
  ` as { rows: EmailTokenRow[] }

  for (const row of result.rows) {
    if (await bcrypt.compare(token, row.token)) {
      return row
    }
  }
  return undefined
}

/**
 * Uses up a token. Returns true only if it was issued for this email and purpose, has not expired,
 * and was not used before. Of two concurrent attempts with the same token, at most one succeeds.
 */
export const consumeEmailToken = async (email: string, token: string, purpose: EmailTokenPurpose, options: ModuleOptions): Promise<boolean> => {
  const db = await useDb(options)
  const table = options.tables.passwordResetTokens

  const result = await db.sql`
    SELECT id, token, purpose, created_at, CURRENT_TIMESTAMP AS db_now FROM {${table}}
    WHERE email = ${email} AND purpose = ${purpose} AND token = ${hashToken(token)}
  ` as { rows: EmailTokenRow[] }
  const row = result.rows[0] ?? await findLegacyToken(email, token, purpose, options)

  if (!row) {
    console.log(`[Nuxt Users] Invalid ${purpose} token for email: ${email}`)
    return false
  }

  // Deleting first makes the token single use even under concurrent requests
  const deleted = await db.sql`DELETE FROM {${table}} WHERE id = ${row.id}`
  if (affectedRows(deleted) !== 1) {
    console.log(`[Nuxt Users] ${purpose} token for email ${email} was already used`)
    return false
  }

  if (isTokenExpired(row.created_at, row.db_now, EMAIL_TOKEN_TTL_HOURS[purpose])) {
    console.log(`[Nuxt Users] Expired ${purpose} token for email: ${email}`)
    return false
  }

  return true
}

/** Deletes every token of the email, whatever the purpose: used when a user is deactivated or deleted */
export const revokeEmailTokens = async (email: string, options: ModuleOptions): Promise<void> => {
  const db = await useDb(options)
  await db.sql`DELETE FROM {${options.tables.passwordResetTokens}} WHERE email = ${email}`
}

/** Deletes the expired tokens of every email and returns how many were deleted */
export const purgeExpiredEmailTokens = async (options: ModuleOptions): Promise<number> => {
  const db = await useDb(options)
  const table = options.tables.passwordResetTokens

  // Expiry is judged here rather than in SQL, which would need interval syntax per database
  const result = await db.sql`
    SELECT id, token, purpose, created_at, CURRENT_TIMESTAMP AS db_now FROM {${table}}
  ` as { rows: EmailTokenRow[] }
  const longestTtl = Math.max(...Object.values(EMAIL_TOKEN_TTL_HOURS))

  let purged = 0
  for (const row of result.rows) {
    const ttl = row.purpose ? EMAIL_TOKEN_TTL_HOURS[row.purpose] : longestTtl
    if (isTokenExpired(row.created_at, row.db_now, ttl)) {
      purged += affectedRows(await db.sql`DELETE FROM {${table}} WHERE id = ${row.id}`)
    }
  }
  return purged
}
