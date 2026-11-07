import { describe, it, expect } from 'vitest'
import { isTokenExpired } from '../../src/runtime/server/utils/token-expiry'

describe('isTokenExpired', () => {
  it('keeps a token valid across a month-end midnight', () => {
    expect(isTokenExpired('2026-01-31 23:30:00', '2026-02-01 00:10:00', 1)).toBe(false)
  })

  it('expires a token older than the limit (SQLite strings)', () => {
    expect(isTokenExpired('2026-11-07 06:00:00', '2026-11-07 07:30:00', 1)).toBe(true)
  })

  it('treats an unparseable timestamp as expired', () => {
    expect(isTokenExpired('not-a-date', '2026-11-07 07:00:00', 1)).toBe(true)
    expect(isTokenExpired('2026-11-07 06:30:00', new Date('invalid'), 1)).toBe(true)
  })

  it('works with Date values (MySQL, PostgreSQL)', () => {
    expect(isTokenExpired(new Date('2026-11-07T06:30:00Z'), new Date('2026-11-07T07:00:00Z'), 1)).toBe(false)
    expect(isTokenExpired(new Date('2026-11-06T06:59:00Z'), new Date('2026-11-07T07:00:00Z'), 24)).toBe(true)
  })
})
