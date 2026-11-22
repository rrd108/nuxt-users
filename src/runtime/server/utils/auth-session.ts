import crypto from 'node:crypto'
import { createError, getCookie, setCookie } from 'h3'
import type { H3Event } from 'h3'
import type { ModuleOptions, User, UserWithoutPassword } from 'nuxt-users/utils'
import { useDb } from './db'
import { revokeUserTokens } from './user'

/**
 * Auth session module: the one place where a session (see GLOSSARY.md) starts, is read and ends.
 * Every login method only proves the user's identity, then calls startSession; every reader asks getSessionUser.
 */

/** The cookie that carries the session token */
export const SESSION_COOKIE = 'auth_token'

export type LoginMethod = 'password' | 'passkey' | 'google'

/** Stored as the token's `name`, so it records which login method started the session */
const TOKEN_NAMES: Record<LoginMethod, string> = {
  password: 'auth_token',
  passkey: 'passkey_auth_token',
  google: 'oauth_auth_token'
}

export const INACTIVE_USER_MESSAGE = 'User account is inactive'

interface SessionContext {
  nuxtUsers?: { user?: UserWithoutPassword }
}

const cookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  ...(maxAge !== undefined && { maxAge })
})

const rememberMeDays = (options: ModuleOptions) => options.auth.rememberMeExpiration || 30

/** How long a session lives: remember me gets days, a regular login `tokenExpiration` minutes */
const sessionLifetimeMinutes = (options: ModuleOptions, rememberMe: boolean) =>
  rememberMe ? rememberMeDays(options) * 24 * 60 : options.auth.tokenExpiration

const cacheUser = (event: H3Event, user: UserWithoutPassword) => {
  const context = (event.context ??= {}) as SessionContext
  context.nuxtUsers = { ...context.nuxtUsers, user }
}

/**
 * Stores a new session token. Its expiry is computed by the database from its own CURRENT_TIMESTAMP,
 * the same clock every reader compares against, so the lifetime is right whatever time zones
 * the database session and the Node process use.
 */
const insertSessionToken = async (userId: number, tokenName: string, minutes: number, options: ModuleOptions): Promise<string> => {
  const db = await useDb(options)
  const table = options.tables.personalAccessTokens
  const token = crypto.randomBytes(64).toString('hex')

  if (options.connector.name === 'mysql') {
    await db.sql`
      INSERT INTO {${table}} (tokenable_type, tokenable_id, name, token, expires_at, created_at, updated_at)
      VALUES ('user', ${userId}, ${tokenName}, ${token}, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ${minutes} MINUTE), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    return token
  }
  if (options.connector.name === 'postgresql') {
    await db.sql`
      INSERT INTO {${table}} (tokenable_type, tokenable_id, name, token, expires_at, created_at, updated_at)
      VALUES ('user', ${userId}, ${tokenName}, ${token}, CURRENT_TIMESTAMP + make_interval(mins => CAST(${minutes} AS INTEGER)), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    return token
  }
  await db.sql`
    INSERT INTO {${table}} (tokenable_type, tokenable_id, name, token, expires_at, created_at, updated_at)
    VALUES ('user', ${userId}, ${tokenName}, ${token}, datetime('now', ${`+${minutes} minutes`}), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `
  return token
}

/**
 * Starts a session for a user whose identity a login method has just proven, and sets the session cookie.
 * Only active users may hold a session: unconfirmed and deactivated users get a 403.
 */
export const startSession = async (
  event: H3Event,
  user: Pick<User, 'id' | 'active'>,
  loginMethod: LoginMethod,
  options: ModuleOptions,
  rememberMe = false
): Promise<string> => {
  if (!user.active) {
    throw createError({ statusCode: 403, statusMessage: INACTIVE_USER_MESSAGE })
  }

  const token = await insertSessionToken(user.id, TOKEN_NAMES[loginMethod], sessionLifetimeMinutes(options, rememberMe), options)

  // remember me gets a long-lived cookie, a regular login a browser-session cookie
  setCookie(event, SESSION_COOKIE, token, cookieOptions(rememberMe ? rememberMeDays(options) * 24 * 60 * 60 : undefined))
  return token
}

/** The session token the request carries, if any */
export const readSessionToken = (event: H3Event): string | undefined => getCookie(event, SESSION_COOKIE) || undefined

/**
 * Finds the active user a session token belongs to, or null for an unknown, expired or deactivated one.
 * Marks the token as used.
 */
export const getCurrentUserFromToken = async <T extends boolean = false>(
  token: string,
  options: ModuleOptions,
  withPass: T = false as T
): Promise<T extends true ? User | null : UserWithoutPassword | null> => {
  type Result = T extends true ? User | null : UserWithoutPassword | null
  const db = await useDb(options)
  const tokensTable = options.tables.personalAccessTokens
  const usersTable = options.tables.users

  const tokenResult = await db.sql`
    SELECT tokenable_id FROM {${tokensTable}}
    WHERE token = ${token}
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  ` as { rows: Array<{ tokenable_id: number }> }

  const tokenRow = tokenResult.rows[0]
  if (!tokenRow) {
    return null as Result
  }

  await db.sql`UPDATE {${tokensTable}} SET last_used_at = CURRENT_TIMESTAMP WHERE token = ${token}`

  const userResult = await db.sql`SELECT * FROM {${usersTable}} WHERE id = ${tokenRow.tokenable_id}` as { rows: User[] }
  const user = userResult.rows[0]
  if (!user || !user.active) {
    return null as Result
  }

  if (withPass === true) {
    return user as Result
  }
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword as Result
}

/**
 * The user of the request's session, or null without a valid one.
 * The first lookup in a request is cached in event.context, so the authorization middleware
 * and the handler after it hit the database only once.
 */
export const getSessionUser = async (event: H3Event, options: ModuleOptions): Promise<UserWithoutPassword | null> => {
  const cached = (event.context as SessionContext | undefined)?.nuxtUsers?.user
  if (cached) {
    return cached
  }

  const token = readSessionToken(event)
  if (!token) {
    return null
  }

  const user = await getCurrentUserFromToken(token, options)
  if (user) {
    cacheUser(event, user)
  }
  return user
}

/** Like getSessionUser, but answers 401 without a valid session */
export const requireSessionUser = async (event: H3Event, options: ModuleOptions): Promise<UserWithoutPassword> => {
  const user = await getSessionUser(event, options)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: readSessionToken(event) ? 'Unauthorized - Invalid authentication token' : 'Unauthorized - No authentication token found'
    })
  }
  return user
}

/** Ends the request's session (logout): deletes its token and clears the cookie */
export const endSession = async (event: H3Event, options: ModuleOptions): Promise<void> => {
  const token = readSessionToken(event)
  if (token) {
    const db = await useDb(options)
    await db.sql`DELETE FROM {${options.tables.personalAccessTokens}} WHERE token = ${token}`
  }
  setCookie(event, SESSION_COOKIE, '', cookieOptions(0))
  const context = event.context as SessionContext | undefined
  if (context?.nuxtUsers) {
    delete context.nuxtUsers.user
  }
}

/** Ends every other session of the user and keeps the request's own, e.g. after a password change */
export const endOtherSessions = async (event: H3Event, userId: number, options: ModuleOptions): Promise<void> => {
  await revokeUserTokens(userId, options, readSessionToken(event))
}

const toIsoString = (value: Date | string | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null
  }
  return value instanceof Date ? value.toISOString() : value
}

/**
 * When each user last logged in, i.e. started their newest session, in one query.
 * Users who never logged in map to null.
 */
export const getLastLoginTimes = async (userIds: number[], options: ModuleOptions): Promise<Map<number, string | null>> => {
  const ids = [...new Set(userIds)].filter(id => Number.isSafeInteger(id))
  const lastLogins = new Map<number, string | null>(ids.map(id => [id, null]))
  if (ids.length === 0) {
    return lastLogins
  }

  const db = await useDb(options)
  // The ids are checked safe integers, so the list can be inlined: db0 has no array binding
  const result = await db.sql`
    SELECT tokenable_id, MAX(created_at) AS last_login_at
    FROM {${options.tables.personalAccessTokens}}
    WHERE tokenable_type = 'user' AND tokenable_id IN ({${ids.join(', ')}})
    GROUP BY tokenable_id
  ` as { rows: Array<{ tokenable_id: number | string, last_login_at: Date | string | null }> }

  for (const row of result.rows) {
    lastLogins.set(Number(row.tokenable_id), toIsoString(row.last_login_at))
  }
  return lastLogins
}

/** When the user last logged in, or null if never */
export const getLastLoginTime = async (userId: number, options: ModuleOptions): Promise<string | null> =>
  (await getLastLoginTimes([userId], options)).get(userId) ?? null
