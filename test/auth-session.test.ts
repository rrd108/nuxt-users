import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { createEvent } from 'h3'
import type { H3Event } from 'h3'
import type { Database } from 'db0'
import type { DatabaseType, DatabaseConfig, ModuleOptions, UserWithoutPassword } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './test-setup'
import { createUsersTable, createPersonalAccessTokensTable, createUser } from '../src/runtime/server/utils'
import { addActiveToUsers } from '../src/runtime/server/utils/add-active-to-users'
import {
  startSession,
  getSessionUser,
  requireSessionUser,
  endSession,
  endOtherSessions,
  getLastLoginTimes,
  getCurrentUserFromToken
} from '../src/runtime/server/utils/auth-session'

/** A real h3 event, optionally carrying a session cookie */
const makeEvent = (token?: string): H3Event => {
  const req = new IncomingMessage(new Socket())
  if (token) {
    req.headers.cookie = `auth_token=${token}`
  }
  return createEvent(req, new ServerResponse(req))
}

const setCookieHeader = (event: H3Event): string => {
  const header = event.node.res.getHeader('set-cookie')
  return Array.isArray(header) ? header.join('\n') : String(header ?? '')
}

// SQLite returns zone-less 'YYYY-MM-DD HH:MM:SS' strings (UTC), the other drivers Dates
const toMs = (value: Date | string) => {
  if (value instanceof Date) {
    return value.getTime()
  }
  return value.includes('T') ? Date.parse(value) : Date.parse(`${value.replace(' ', 'T')}Z`)
}

describe('Auth session module', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let user: Pick<UserWithoutPassword, 'id' | 'email' | 'active'>

  beforeEach(async () => {
    dbType = (process.env.DB_CONNECTOR || 'sqlite') as DatabaseType
    let dbConfig: DatabaseConfig = { path: './_auth_session' }
    if (dbType === 'mysql' || dbType === 'postgresql') {
      dbConfig = {
        host: process.env.DB_HOST,
        port: Number.parseInt(process.env.DB_PORT || (dbType === 'mysql' ? '3306' : '5432')),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      }
    }
    const settings = await createTestSetup({ dbType, dbConfig })
    db = settings.db
    testOptions = settings.testOptions
    await createUsersTable(testOptions)
    await addActiveToUsers(testOptions)
    await createPersonalAccessTokensTable(testOptions)
    const created = await createUser({ email: 'session@example.com', name: 'Session', password: 'password123' }, testOptions)
    user = { id: created.id, email: created.email, active: true }
  })

  afterEach(async () => {
    const path = testOptions.connector!.options.path!
    await cleanupTestSetup(dbType, db, [path], testOptions.tables.personalAccessTokens)
    await cleanupTestSetup(dbType, db, [path], testOptions.tables.users)
  })

  const tokenRows = async () => {
    const result = await db.sql`SELECT token, name, created_at, expires_at FROM {${testOptions.tables.personalAccessTokens}}` as { rows: Array<{ token: string, name: string, created_at: Date | string, expires_at: Date | string }> }
    return result.rows
  }

  it('a started session is the session of the next request carrying its cookie', async () => {
    const token = await startSession(makeEvent(), user, 'password', testOptions)

    const current = await getSessionUser(makeEvent(token), testOptions)

    expect(current).toMatchObject({ id: user.id, email: user.email })
    expect(current).not.toHaveProperty('password')
  })

  it('refuses to start a session for an inactive user', async () => {
    const event = makeEvent()

    await expect(startSession(event, { ...user, active: false }, 'password', testOptions)).rejects.toMatchObject({ statusCode: 403 })
    expect(await tokenRows()).toHaveLength(0)
    expect(setCookieHeader(event)).toBe('')
  })

  it('records the login method in the token name', async () => {
    await startSession(makeEvent(), user, 'password', testOptions)
    await startSession(makeEvent(), user, 'passkey', testOptions)
    await startSession(makeEvent(), user, 'google', testOptions)

    expect((await tokenRows()).map(row => row.name).sort()).toEqual(['auth_token', 'oauth_auth_token', 'passkey_auth_token'])
  })

  it('computes expiry on the database clock: tokenExpiration minutes, or rememberMe days', async () => {
    await startSession(makeEvent(), user, 'password', testOptions, false)
    await startSession(makeEvent(), user, 'password', testOptions, true)

    const lifetimesInMinutes = (await tokenRows())
      .map(row => Math.round((toMs(row.expires_at) - toMs(row.created_at)) / 60_000))
      .sort((a, b) => a - b)

    expect(lifetimesInMinutes).toEqual([testOptions.auth.tokenExpiration, testOptions.auth.rememberMeExpiration * 24 * 60])
  })

  it('sets a session cookie for a regular login and a persistent one for remember me', async () => {
    const regular = makeEvent()
    const remembered = makeEvent()
    await startSession(regular, user, 'password', testOptions, false)
    await startSession(remembered, user, 'password', testOptions, true)

    expect(setCookieHeader(regular)).toMatch(/^auth_token=\w+; Path=\/; HttpOnly; SameSite=Lax$/)
    expect(setCookieHeader(remembered)).toContain(`Max-Age=${testOptions.auth.rememberMeExpiration * 24 * 60 * 60}`)
  })

  it('does not accept an expired token', async () => {
    const token = await startSession(makeEvent(), user, 'password', testOptions)
    await db.sql`UPDATE {${testOptions.tables.personalAccessTokens}} SET expires_at = created_at`

    expect(await getSessionUser(makeEvent(token), testOptions)).toBeNull()
  })

  it('does not accept the token of a user deactivated after login', async () => {
    const token = await startSession(makeEvent(), user, 'password', testOptions)
    await db.sql`UPDATE {${testOptions.tables.users}} SET active = ${dbType === 'sqlite' ? 0 : false} WHERE id = ${user.id}`

    expect(await getCurrentUserFromToken(token, testOptions)).toBeNull()
  })

  it('looks the session up once per request', async () => {
    const token = await startSession(makeEvent(), user, 'password', testOptions)
    const event = makeEvent(token)
    await getSessionUser(event, testOptions)

    // Gone from the database, still known for the rest of this request
    await db.sql`DELETE FROM {${testOptions.tables.personalAccessTokens}}`
    expect(await getSessionUser(event, testOptions)).toMatchObject({ id: user.id })
    expect(await getSessionUser(makeEvent(token), testOptions)).toBeNull()
  })

  it('answers 401 when a session is required but missing or invalid', async () => {
    await expect(requireSessionUser(makeEvent(), testOptions)).rejects.toMatchObject({ statusCode: 401 })
    await expect(requireSessionUser(makeEvent('nope'), testOptions)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('ending a session deletes its token and clears the cookie', async () => {
    const token = await startSession(makeEvent(), user, 'password', testOptions)
    const other = await startSession(makeEvent(), user, 'password', testOptions)
    const event = makeEvent(token)

    await endSession(event, testOptions)

    expect(setCookieHeader(event)).toMatch(/^auth_token=; Max-Age=0; Path=\/; HttpOnly; SameSite=Lax$/)
    expect((await tokenRows()).map(row => row.token)).toEqual([other])
  })

  it('ending the other sessions keeps the current one', async () => {
    const current = await startSession(makeEvent(), user, 'password', testOptions)
    await startSession(makeEvent(), user, 'passkey', testOptions)

    await endOtherSessions(makeEvent(current), user.id, testOptions)

    expect((await tokenRows()).map(row => row.token)).toEqual([current])
  })

  it('reports the last login of many users in one call, null for those who never logged in', async () => {
    const other = await createUser({ email: 'never@example.com', name: 'Never', password: 'password123' }, testOptions)
    await startSession(makeEvent(), user, 'password', testOptions)
    await db.sql`UPDATE {${testOptions.tables.personalAccessTokens}} SET created_at = '2020-01-01 10:00:00'`
    await startSession(makeEvent(), user, 'password', testOptions)

    const lastLogins = await getLastLoginTimes([user.id, other.id], testOptions)

    expect(lastLogins.get(other.id)).toBeNull()
    const lastLogin = lastLogins.get(user.id)
    expect(lastLogin).toBeTruthy()
    expect(toMs(lastLogin!)).toBeGreaterThan(toMs('2021-01-01 00:00:00'))
  })
})
