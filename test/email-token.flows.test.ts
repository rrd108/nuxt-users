import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Database } from 'db0'
import type { DatabaseType, DatabaseConfig, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './test-setup'
import { createUsersTable, createPasswordResetTokensTable, createPersonalAccessTokensTable, createUser, deleteUser, findUserByEmail } from '../src/runtime/server/utils'
import { addActiveToUsers } from '../src/runtime/server/utils/add-active-to-users'
import { resetPassword, sendPasswordResetLink } from '../src/runtime/server/services/password'
import { confirmUserEmail, registerUser } from '../src/runtime/server/services/registration'

// The mail adapter is replaced so the tests can read the links that would be emailed
const sentMails: Array<{ to: string, text: string }> = []
vi.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: async (mail: { to: string, text: string }) => {
      sentMails.push(mail)
      return { messageId: 'test' }
    }
  })
}))

const EMAIL = 'email-flows@example.com'
const BASE_URL = 'https://app.example.com'

// Node time zones chosen to differ from the database's (CET locally, UTC in CI) in both directions
const NODE_AHEAD_OF_DB = 'Etc/GMT-3' // UTC+3
const NODE_BEHIND_DB = 'Etc/GMT+5' // UTC-5

/** The token in the link of the last email sent to `to` */
const tokenFromLastMail = (to: string): string => {
  const mail = sentMails.filter(m => m.to === to).at(-1)
  if (!mail) {
    throw new Error(`No email was sent to ${to}`)
  }
  const link = mail.text.match(/https?:\/\/\S+/)?.[0]
  const token = link ? new URL(link).searchParams.get('token') : null
  if (!token) {
    throw new Error('The email has no token link')
  }
  return token
}

describe('Email token flows', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  const originalTz = process.env.TZ

  beforeEach(async () => {
    sentMails.length = 0
    dbType = (process.env.DB_CONNECTOR || 'sqlite') as DatabaseType
    let dbConfig: DatabaseConfig = { path: './_email_flows' }
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
    await createPasswordResetTokensTable(testOptions)
    await createPersonalAccessTokensTable(testOptions)
  })

  afterEach(async () => {
    process.env.TZ = originalTz
    const paths = [testOptions.connector!.options.path!]
    await cleanupTestSetup(dbType, db, paths, testOptions.tables.users)
    await cleanupTestSetup(dbType, db, paths, testOptions.tables.passwordResetTokens)
    await cleanupTestSetup(dbType, db, paths, testOptions.tables.personalAccessTokens)
  })

  // Moves every token's creation time back with the database's own clock
  const backdate = async (minutesAgo: number) => {
    const table = testOptions.tables.passwordResetTokens
    if (dbType === 'mysql') {
      await db.sql`UPDATE {${table}} SET created_at = CURRENT_TIMESTAMP - INTERVAL ${minutesAgo} MINUTE`
      return
    }
    if (dbType === 'postgresql') {
      await db.sql`UPDATE {${table}} SET created_at = CURRENT_TIMESTAMP - make_interval(mins => CAST(${minutesAgo} AS INTEGER))`
      return
    }
    await db.sql`UPDATE {${table}} SET created_at = datetime('now', ${`-${minutesAgo} minutes`})`
  }

  const requestReset = async () => {
    await sendPasswordResetLink(EMAIL, testOptions, BASE_URL)
    return tokenFromLastMail(EMAIL)
  }

  const register = async () => {
    await registerUser({ email: EMAIL, name: 'Email Flows', password: 'Password123!' }, testOptions, BASE_URL)
    return tokenFromLastMail(EMAIL)
  }

  describe('expiry uses the database clock (issue #220)', () => {
    it('accepts a fresh password reset token when Node is ahead of the database time zone', async () => {
      process.env.TZ = NODE_AHEAD_OF_DB
      await createUser({ email: EMAIL, name: 'Email Flows', password: 'Password123!' }, testOptions)
      const token = await requestReset()

      expect(await resetPassword(token, EMAIL, 'NewPassword123!', testOptions)).toBe(true)
    })

    it('rejects a 90-minute-old password reset token when Node is behind the database time zone', async () => {
      process.env.TZ = NODE_BEHIND_DB
      await createUser({ email: EMAIL, name: 'Email Flows', password: 'Password123!' }, testOptions)
      const token = await requestReset()
      await backdate(90)

      expect(await resetPassword(token, EMAIL, 'NewPassword123!', testOptions)).toBe(false)
    })

    it('accepts a fresh confirmation token when Node is ahead of the database time zone', async () => {
      process.env.TZ = NODE_AHEAD_OF_DB
      const token = await register()

      expect(await confirmUserEmail(token, EMAIL, testOptions)).toBe(true)
    })

    it('rejects a 25-hour-old confirmation token when Node is behind the database time zone', async () => {
      process.env.TZ = NODE_BEHIND_DB
      const token = await register()
      await backdate(25 * 60)

      expect(await confirmUserEmail(token, EMAIL, testOptions)).toBe(false)
    })
  })

  it('confirms a registered user with the emailed link', async () => {
    const token = await register()

    expect(await confirmUserEmail(token, EMAIL, testOptions)).toBe(true)
    expect(Boolean((await findUserByEmail(EMAIL, testOptions))?.active)).toBe(true)
  })

  it('does not accept a password reset token as an email confirmation', async () => {
    await createUser({ email: EMAIL, name: 'Email Flows', password: 'Password123!' }, testOptions)
    const token = await requestReset()

    expect(await confirmUserEmail(token, EMAIL, testOptions)).toBe(false)
  })

  it('sends no password reset link to a deactivated user', async () => {
    const user = await createUser({ email: EMAIL, name: 'Email Flows', password: 'Password123!' }, testOptions)
    await deleteUser(user.id, testOptions)

    await sendPasswordResetLink(EMAIL, testOptions, BASE_URL)

    expect(sentMails).toHaveLength(0)
  })

  it('sends no password reset link to an unconfirmed user', async () => {
    await register()
    sentMails.length = 0

    await sendPasswordResetLink(EMAIL, testOptions, BASE_URL)

    expect(sentMails).toHaveLength(0)
  })

  it('voids the confirmation link of an unconfirmed user who is deactivated', async () => {
    const token = await register()
    const user = await findUserByEmail(EMAIL, testOptions)
    await deleteUser(user!.id, testOptions)

    expect(await confirmUserEmail(token, EMAIL, testOptions)).toBe(false)
  })

  it('voids a password reset link when the user is deactivated', async () => {
    const user = await createUser({ email: EMAIL, name: 'Email Flows', password: 'Password123!' }, testOptions)
    const token = await requestReset()
    await deleteUser(user.id, testOptions)

    expect(await resetPassword(token, EMAIL, 'NewPassword123!', testOptions)).toBe(false)
  })
})
