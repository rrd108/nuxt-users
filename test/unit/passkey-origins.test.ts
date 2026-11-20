import { describe, it, expect } from 'vitest'
import { normalizeOrigins, resolvePasskeyConfig } from '../../src/runtime/server/services/passkey'
import type { ModuleOptions } from 'nuxt-users/utils'

const withPasskey = (origins: unknown, siteUrl = '') => ({
  siteUrl,
  auth: { passkey: { rpId: 'example.com', origins } },
}) as unknown as ModuleOptions

describe('passkey origins', () => {
  it('keeps an array', () => {
    expect(normalizeOrigins(['https://a.com', 'https://b.com/'])).toEqual(['https://a.com', 'https://b.com'])
  })

  it('accepts a single string and a comma-separated list', () => {
    expect(normalizeOrigins('https://a.com')).toEqual(['https://a.com'])
    expect(normalizeOrigins('https://a.com, https://b.com')).toEqual(['https://a.com', 'https://b.com'])
  })

  it('accepts an unparsed JSON array string', () => {
    expect(normalizeOrigins('["https://a.com","https://b.com"]')).toEqual(['https://a.com', 'https://b.com'])
  })

  it('ignores empty values', () => {
    expect(normalizeOrigins('')).toEqual([])
    expect(normalizeOrigins(undefined)).toEqual([])
  })

  it('falls back to the siteUrl origin when origins is empty', () => {
    expect(resolvePasskeyConfig(withPasskey([], 'https://example.com/app')).origins).toEqual(['https://example.com'])
  })

  it('prefers explicit origins over siteUrl', () => {
    expect(resolvePasskeyConfig(withPasskey('https://a.com', 'https://example.com')).origins).toEqual(['https://a.com'])
  })

  it('derives rpId from the siteUrl host when it is not set', () => {
    const options = { siteUrl: 'https://parikrama.example.com', auth: { passkey: {} } } as unknown as ModuleOptions
    const config = resolvePasskeyConfig(options)
    expect(config.rpID).toBe('parikrama.example.com')
    expect(config.origins).toEqual(['https://parikrama.example.com'])
  })

  it('prefers an explicit rpId over siteUrl', () => {
    expect(resolvePasskeyConfig(withPasskey([], 'https://app.example.com')).rpID).toBe('example.com')
  })
})
