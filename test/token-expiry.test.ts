import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import bcrypt from 'bcrypt'
import type { Database } from 'db0'
import type { DatabaseType, DatabaseConfig, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './test-setup'
import { createUsersTable, createPasswordResetTokensTable, createPersonalAccessTokensTable, createUser } from '../src/runtime/server/utils'
import { addActiveToUsers } from '../src/runtime/server/utils/add-active-to-users'
import { resetPassword } from '../src/runtime/server/services/password'
import { confirmUserEmail } from '../src/runtime/server/services/registration'

const EMAIL = 'token-expiry@example.com'
const TOKEN = 'plain-token'

// Node time zones chosen to differ from the database's (CET locally, UTC in CI) in both directions
const NODE_AHEAD_OF_DB = 'Etc/GMT-3' // UTC+3
const NODE_BEHIND_DB = 'Etc/GMT+5' // UTC-5

describe('Token expiry uses the database clock (issue #220)', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  const originalTz = process.env.TZ

  beforeEach(async () => {
    dbType = (process.env.DB_CONNECTOR || 'sqlite') as DatabaseType
    let dbConfig: DatabaseConfig = { path: './_token_expiry' }
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
    await createUser({ email: EMAIL, name: 'Token Expiry', password: 'Password123!' }, testOptions)
  })

  afterEach(async () => {
    process.env.TZ = originalTz
    const paths = [testOptions.connector!.options.path!]
    await cleanupTestSetup(dbType, db, paths, testOptions.tables.users)
    await cleanupTestSetup(dbType, db, paths, testOptions.tables.passwordResetTokens)
    await cleanupTestSetup(dbType, db, paths, testOptions.tables.personalAccessTokens)
  })

  // Inserts a token the way the module does, back-dated with the database's own clock
  const insertToken = async (minutesAgo: number) => {
    const hashed = await bcrypt.hash(TOKEN, 10)
    const table = testOptions.tables.passwordResetTokens
    if (minutesAgo === 0) {
      await db.sql`INSERT INTO {${table}} (email, token, created_at) VALUES (${EMAIL}, ${hashed}, CURRENT_TIMESTAMP)`
      return
    }
    if (dbType === 'mysql') {
      await db.sql`INSERT INTO {${table}} (email, token, created_at) VALUES (${EMAIL}, ${hashed}, CURRENT_TIMESTAMP - INTERVAL ${minutesAgo} MINUTE)`
      return
    }
    if (dbType === 'postgresql') {
      await db.sql`INSERT INTO {${table}} (email, token, created_at) VALUES (${EMAIL}, ${hashed}, CURRENT_TIMESTAMP - make_interval(mins => CAST(${minutesAgo} AS INTEGER)))`
      return
    }
    await db.sql`INSERT INTO {${table}} (email, token, created_at) VALUES (${EMAIL}, ${hashed}, datetime('now', ${`-${minutesAgo} minutes`}))`
  }

  describe('resetPassword (1 hour limit)', () => {
    it('accepts a fresh token when Node is ahead of the database time zone', async () => {
      process.env.TZ = NODE_AHEAD_OF_DB
      await insertToken(0)

      expect(await resetPassword(TOKEN, EMAIL, 'NewPassword123!', testOptions)).toBe(true)
    })

    it('rejects a 90-minute-old token when Node is behind the database time zone', async () => {
      process.env.TZ = NODE_BEHIND_DB
      await insertToken(90)

      expect(await resetPassword(TOKEN, EMAIL, 'NewPassword123!', testOptions)).toBe(false)
    })
  })

  describe('confirmUserEmail (24 hour limit)', () => {
    it('accepts a fresh token when Node is ahead of the database time zone', async () => {
      process.env.TZ = NODE_AHEAD_OF_DB
      await insertToken(0)

      expect(await confirmUserEmail(TOKEN, EMAIL, testOptions)).toBe(true)
    })

    it('rejects a 25-hour-old token when Node is behind the database time zone', async () => {
      process.env.TZ = NODE_BEHIND_DB
      await insertToken(25 * 60)

      expect(await confirmUserEmail(TOKEN, EMAIL, testOptions)).toBe(false)
    })
  })
})
