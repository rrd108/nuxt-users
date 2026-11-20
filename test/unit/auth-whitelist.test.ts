import { describe, it, expect } from 'vitest'
import { computeAuthWhitelist } from '../../src/auth-whitelist'

const base = '/api/nuxt-users'

describe('computeAuthWhitelist', () => {
  it('keeps a plain whitelist as is', () => {
    expect(computeAuthWhitelist({ whitelist: ['/noauth'], apiBasePath: base })).toEqual(['/noauth'])
  })

  it('adds the registration endpoints when /register is whitelisted', () => {
    const result = computeAuthWhitelist({ whitelist: ['/register'], apiBasePath: base })
    expect(result).toEqual(expect.arrayContaining(['/register', '/confirm-email', `${base}/register`, `${base}/confirm-email`]))
  })

  it('adds the Google OAuth endpoints when Google is configured', () => {
    const result = computeAuthWhitelist({ whitelist: [], apiBasePath: base, google: true })
    expect(result).toEqual([`${base}/auth/google/redirect`, `${base}/auth/google/callback`])
  })

  describe('passkeys', () => {
    it('whitelists only the unauthenticated login endpoints', () => {
      const result = computeAuthWhitelist({ whitelist: [], apiBasePath: base, passkey: true })
      expect(result).toEqual([`${base}/passkey/login/options`, `${base}/passkey/login/verify`])
    })

    it('adds nothing when passkeys are not configured', () => {
      const result = computeAuthWhitelist({ whitelist: ['/noauth'], apiBasePath: base, passkey: false })
      expect(result.some(path => path.includes('passkey'))).toBe(false)
    })

    it('follows a custom apiBasePath', () => {
      const result = computeAuthWhitelist({ whitelist: [], apiBasePath: '/auth-api', passkey: true })
      expect(result).toEqual(['/auth-api/passkey/login/options', '/auth-api/passkey/login/verify'])
    })

    it('does not duplicate endpoints that are already whitelisted', () => {
      const result = computeAuthWhitelist({ whitelist: [`${base}/passkey/login/options`], apiBasePath: base, passkey: true })
      expect(result.filter(path => path === `${base}/passkey/login/options`)).toHaveLength(1)
    })

    it('combines with Google and registration', () => {
      const result = computeAuthWhitelist({ whitelist: ['/register'], apiBasePath: base, google: true, passkey: true })
      expect(result).toEqual(expect.arrayContaining([`${base}/register`, `${base}/auth/google/callback`, `${base}/passkey/login/verify`]))
    })
  })
})
