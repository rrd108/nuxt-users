import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import bcrypt from 'bcrypt'
import type { Database } from 'db0'
import type { DatabaseType, DatabaseConfig, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './test-setup'
import { createPasswordResetTokensTable } from '../src/runtime/server/utils'
import { issueEmailToken, consumeEmailToken, revokeEmailTokens, purgeExpiredEmailTokens } from '../src/runtime/server/utils/email-token'

const EMAIL = 'email-token@example.com'

describe('Email token module', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType

  beforeEach(async () => {
    dbType = (process.env.DB_CONNECTOR || 'sqlite') as DatabaseType
    let dbConfig: DatabaseConfig = { path: './_email_token' }
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
    await createPasswordResetTokensTable(testOptions)
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.passwordResetTokens)
  })

  it('accepts an issued token once, for its own purpose', async () => {
    const token = await issueEmailToken(EMAIL, 'password_reset', testOptions)

    expect(await consumeEmailToken(EMAIL, token, 'password_reset', testOptions)).toBe(true)
    expect(await consumeEmailToken(EMAIL, token, 'password_reset', testOptions)).toBe(false)
  })

  // Moves a token's creation time back with the database's own clock
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

  it('never accepts a token for the other purpose', async () => {
    const resetToken = await issueEmailToken(EMAIL, 'password_reset', testOptions)

    expect(await consumeEmailToken(EMAIL, resetToken, 'email_confirmation', testOptions)).toBe(false)
    expect(await consumeEmailToken(EMAIL, resetToken, 'password_reset', testOptions)).toBe(true)
  })

  it('only accepts a token for the email it was issued to', async () => {
    const token = await issueEmailToken(EMAIL, 'password_reset', testOptions)

    expect(await consumeEmailToken('someone-else@example.com', token, 'password_reset', testOptions)).toBe(false)
  })

  it('accepts only the newest token of a purpose', async () => {
    const older = await issueEmailToken(EMAIL, 'password_reset', testOptions)
    const newer = await issueEmailToken(EMAIL, 'password_reset', testOptions)

    expect(await consumeEmailToken(EMAIL, older, 'password_reset', testOptions)).toBe(false)
    expect(await consumeEmailToken(EMAIL, newer, 'password_reset', testOptions)).toBe(true)
  })

  it('keeps tokens of the other purpose when one is issued or consumed', async () => {
    const confirmation = await issueEmailToken(EMAIL, 'email_confirmation', testOptions)
    const reset = await issueEmailToken(EMAIL, 'password_reset', testOptions)
    await consumeEmailToken(EMAIL, reset, 'password_reset', testOptions)

    expect(await consumeEmailToken(EMAIL, confirmation, 'email_confirmation', testOptions)).toBe(true)
  })

  it('rejects a password reset token older than 1 hour', async () => {
    const token = await issueEmailToken(EMAIL, 'password_reset', testOptions)
    await backdate(61)

    expect(await consumeEmailToken(EMAIL, token, 'password_reset', testOptions)).toBe(false)
  })

  it('accepts a confirmation token for 24 hours', async () => {
    const fresh = await issueEmailToken(EMAIL, 'email_confirmation', testOptions)
    await backdate(23 * 60)
    expect(await consumeEmailToken(EMAIL, fresh, 'email_confirmation', testOptions)).toBe(true)

    const stale = await issueEmailToken(EMAIL, 'email_confirmation', testOptions)
    await backdate(25 * 60)
    expect(await consumeEmailToken(EMAIL, stale, 'email_confirmation', testOptions)).toBe(false)
  })

  it('lets only one of two concurrent attempts use a token', async () => {
    const token = await issueEmailToken(EMAIL, 'password_reset', testOptions)

    const results = await Promise.all([
      consumeEmailToken(EMAIL, token, 'password_reset', testOptions),
      consumeEmailToken(EMAIL, token, 'password_reset', testOptions)
    ])

    expect(results.filter(Boolean)).toHaveLength(1)
  })

  it('revokes every token of an email, whatever the purpose', async () => {
    const reset = await issueEmailToken(EMAIL, 'password_reset', testOptions)
    const confirmation = await issueEmailToken(EMAIL, 'email_confirmation', testOptions)
    const otherUsers = await issueEmailToken('other@example.com', 'password_reset', testOptions)

    await revokeEmailTokens(EMAIL, testOptions)

    expect(await consumeEmailToken(EMAIL, reset, 'password_reset', testOptions)).toBe(false)
    expect(await consumeEmailToken(EMAIL, confirmation, 'email_confirmation', testOptions)).toBe(false)
    expect(await consumeEmailToken('other@example.com', otherUsers, 'password_reset', testOptions)).toBe(true)
  })

  it('purges expired tokens and keeps valid ones', async () => {
    await issueEmailToken('a@example.com', 'password_reset', testOptions)
    await issueEmailToken('b@example.com', 'email_confirmation', testOptions)
    await backdate(2 * 60) // the reset token has expired, the confirmation token has not
    const fresh = await issueEmailToken('c@example.com', 'password_reset', testOptions)

    expect(await purgeExpiredEmailTokens(testOptions)).toBe(1)
    expect(await purgeExpiredEmailTokens(testOptions)).toBe(0)
    expect(await consumeEmailToken('c@example.com', fresh, 'password_reset', testOptions)).toBe(true)
  })

  describe('tokens issued before SHA-256 hashing (bcrypt, docs/adr/0001)', () => {
    const insertLegacyToken = async (token: string, purpose: string) => {
      const hashed = await bcrypt.hash(token, 10)
      await db.sql`
        INSERT INTO {${testOptions.tables.passwordResetTokens}} (email, token, purpose, created_at)
        VALUES (${EMAIL}, ${hashed}, ${purpose}, CURRENT_TIMESTAMP)
      `
    }

    it('accepts a legacy token once, for its own purpose', async () => {
      await insertLegacyToken('legacy-token', 'email_confirmation')

      expect(await consumeEmailToken(EMAIL, 'legacy-token', 'password_reset', testOptions)).toBe(false)
      expect(await consumeEmailToken(EMAIL, 'legacy-token', 'email_confirmation', testOptions)).toBe(true)
      expect(await consumeEmailToken(EMAIL, 'legacy-token', 'email_confirmation', testOptions)).toBe(false)
    })

    it('rejects an expired legacy token', async () => {
      await insertLegacyToken('legacy-token', 'password_reset')
      await backdate(61)

      expect(await consumeEmailToken(EMAIL, 'legacy-token', 'password_reset', testOptions)).toBe(false)
    })
  })
})
