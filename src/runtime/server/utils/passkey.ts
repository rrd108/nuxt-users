import crypto from 'node:crypto'
import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'

export type PasskeyChallengeType = 'registration' | 'authentication'

interface PasskeyRow {
  id: number
  user_id: number
  credential_id: string
  public_key: string
  counter: number | string
  transports: string | null
  device_type: string
  backed_up: number | boolean
  name: string
  user_handle: string
  created_at: string | Date
  last_used_at: string | Date | null
}

export interface Passkey {
  id: number
  user_id: number
  credential_id: string
  /** base64url encoded COSE public key */
  public_key: string
  counter: number
  transports: string[]
  device_type: string
  backed_up: boolean
  name: string
  /** Random per-user WebAuthn user handle (never the database id) */
  user_handle: string
  created_at: string | Date
  last_used_at: string | Date | null
}

export interface NewPasskey {
  userId: number
  credentialId: string
  publicKey: string
  counter: number
  transports?: string[]
  deviceType: string
  backedUp: boolean
  name: string
  userHandle: string
}

/** How long a registration or login challenge can be answered */
export const PASSKEY_CHALLENGE_TTL_SECONDS = 5 * 60

/** Rows touched by a write: db0 passes the driver result through, and every driver names the count differently */
const affectedRows = (result: unknown): number => {
  const { changes, affectedRows, rowCount } = result as { changes?: number, affectedRows?: number, rowCount?: number }
  return Number(changes ?? affectedRows ?? rowCount ?? 0)
}

const toPasskey = (row: PasskeyRow): Passkey => ({
  id: Number(row.id),
  user_id: Number(row.user_id),
  credential_id: row.credential_id,
  public_key: row.public_key,
  counter: Number(row.counter),
  transports: row.transports ? JSON.parse(row.transports) as string[] : [],
  device_type: row.device_type,
  backed_up: Boolean(row.backed_up),
  name: row.name,
  user_handle: row.user_handle,
  created_at: row.created_at,
  last_used_at: row.last_used_at ?? null,
})

export const saveChallenge = async (
  options: ModuleOptions,
  { challenge, type, userId = null, ttlSeconds = PASSKEY_CHALLENGE_TTL_SECONDS }: { challenge: string, type: PasskeyChallengeType, userId?: number | null, ttlSeconds?: number }
): Promise<void> => {
  const db = await useDb(options)
  const expiresAt = Date.now() + ttlSeconds * 1000

  await db.sql`
    INSERT INTO {${options.tables.passkeyChallenges}} (challenge, type, user_id, expires_at)
    VALUES (${challenge}, ${type}, ${userId}, ${expiresAt})
  `
}

/**
 * Looks up a challenge and deletes it, so it can be answered once. Returns null when it is unknown,
 * of another ceremony type or expired (an expired one is deleted too).
 */
export const consumeChallenge = async (
  options: ModuleOptions,
  challenge: string,
  type: PasskeyChallengeType
): Promise<{ userId: number | null } | null> => {
  const db = await useDb(options)
  const table = options.tables.passkeyChallenges

  const result = await db.sql`SELECT id, type, user_id, expires_at FROM {${table}} WHERE challenge = ${challenge}` as {
    rows: Array<{ id: number, type: string, user_id: number | null, expires_at: number | string }>
  }
  const row = result.rows[0]
  if (!row) {
    return null
  }

  // Delete first, whatever the outcome: a challenge is never usable twice. Only the attempt whose DELETE
  // actually removed the row wins, so concurrent attempts cannot both succeed.
  const deleted = await db.sql`DELETE FROM {${table}} WHERE id = ${row.id}`
  if (affectedRows(deleted) !== 1) {
    return null
  }

  if (row.type !== type || Number(row.expires_at) <= Date.now()) {
    return null
  }
  return { userId: row.user_id === null ? null : Number(row.user_id) }
}

export const deleteExpiredPasskeyChallenges = async (options: ModuleOptions): Promise<number> => {
  const db = await useDb(options)
  const table = options.tables.passkeyChallenges
  const now = Date.now()

  const expired = await db.sql`SELECT id FROM {${table}} WHERE expires_at <= ${now}` as { rows: unknown[] }
  await db.sql`DELETE FROM {${table}} WHERE expires_at <= ${now}`

  return expired.rows.length
}

export const listPasskeys = async (options: ModuleOptions, userId: number): Promise<Passkey[]> => {
  const db = await useDb(options)
  const result = await db.sql`SELECT * FROM {${options.tables.passkeys}} WHERE user_id = ${userId} ORDER BY id` as { rows: PasskeyRow[] }
  return result.rows.map(toPasskey)
}

export const findPasskeyByCredentialId = async (options: ModuleOptions, credentialId: string): Promise<Passkey | null> => {
  const db = await useDb(options)
  const result = await db.sql`SELECT * FROM {${options.tables.passkeys}} WHERE credential_id = ${credentialId}` as { rows: PasskeyRow[] }
  const row = result.rows[0]
  return row ? toPasskey(row) : null
}

/**
 * The WebAuthn user handle of a user: the one their existing passkeys carry, or a new random one.
 * It is only persisted with the user's first passkey, and is deliberately not derived from the user id.
 */
export const getOrCreateUserHandle = async (options: ModuleOptions, userId: number): Promise<string> => {
  const db = await useDb(options)
  const result = await db.sql`SELECT user_handle FROM {${options.tables.passkeys}} WHERE user_id = ${userId} ORDER BY id LIMIT 1` as { rows: Array<{ user_handle: string }> }
  return result.rows[0]?.user_handle ?? crypto.randomBytes(32).toString('base64url')
}

export const addPasskey = async (options: ModuleOptions, passkey: NewPasskey): Promise<Passkey> => {
  const db = await useDb(options)
  const table = options.tables.passkeys
  const transports = passkey.transports?.length ? JSON.stringify(passkey.transports) : null
  const backedUp = options.connector!.name === 'postgresql' ? passkey.backedUp : (passkey.backedUp ? 1 : 0)

  await db.sql`
    INSERT INTO {${table}} (user_id, credential_id, public_key, counter, transports, device_type, backed_up, name, user_handle)
    VALUES (${passkey.userId}, ${passkey.credentialId}, ${passkey.publicKey}, ${passkey.counter}, ${transports}, ${passkey.deviceType}, ${backedUp}, ${passkey.name}, ${passkey.userHandle})
  `

  const created = await findPasskeyByCredentialId(options, passkey.credentialId)
  if (!created) {
    throw new Error('[Nuxt Users] Passkey was not saved')
  }

  // Concurrent first registrations may each have generated a handle: the oldest passkey's one wins
  const canonical = await db.sql`SELECT user_handle FROM {${table}} WHERE user_id = ${passkey.userId} ORDER BY id LIMIT 1` as { rows: Array<{ user_handle: string }> }
  const handle = canonical.rows[0]?.user_handle
  if (handle && handle !== created.user_handle) {
    await db.sql`UPDATE {${table}} SET user_handle = ${handle} WHERE id = ${created.id}`
    created.user_handle = handle
  }
  return created
}

export const updatePasskeyCounter = async (options: ModuleOptions, id: number, counter: number): Promise<void> => {
  const db = await useDb(options)
  await db.sql`UPDATE {${options.tables.passkeys}} SET counter = ${counter}, last_used_at = CURRENT_TIMESTAMP WHERE id = ${id}`
}

/** Deletes a passkey if it belongs to the user. Returns whether one was deleted. */
export const deletePasskey = async (options: ModuleOptions, userId: number, id: number): Promise<boolean> => {
  const db = await useDb(options)
  const table = options.tables.passkeys

  const deleted = await db.sql`DELETE FROM {${table}} WHERE id = ${id} AND user_id = ${userId}`
  return affectedRows(deleted) > 0
}

export const deletePasskeysForUser = async (options: ModuleOptions, userId: number): Promise<void> => {
  const db = await useDb(options)
  await db.sql`DELETE FROM {${options.tables.passkeys}} WHERE user_id = ${userId}`
}
