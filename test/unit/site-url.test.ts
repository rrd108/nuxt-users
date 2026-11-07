import { describe, it, expect, afterEach, vi } from 'vitest'
import type { H3Event } from 'h3'
import type { ModuleOptions } from '../../src/types'
import { defaultOptions } from '../../src/module'
import { getSiteUrl, SITE_URL_REQUIRED_MESSAGE } from '../../src/runtime/server/utils/site-url'

const eventWithHeaders = (headers: Record<string, string>) => ({
  node: { req: { headers } },
  headers: new Headers(headers)
}) as unknown as H3Event

describe('getSiteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses the configured siteUrl and ignores the Host header', () => {
    const options = { ...defaultOptions, siteUrl: 'https://app.example.com/' } as ModuleOptions
    const event = eventWithHeaders({ 'host': 'evil.example', 'x-forwarded-proto': 'https' })
    expect(getSiteUrl(event, options)).toBe('https://app.example.com')
  })

  it('throws in production when siteUrl is not configured', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const event = eventWithHeaders({ host: 'evil.example' })
    expect(() => getSiteUrl(event, defaultOptions)).toThrow(SITE_URL_REQUIRED_MESSAGE)
  })

  it('has a siteUrl key in the defaults so NUXT_NUXT_USERS_SITE_URL can override it', () => {
    // Nuxt only applies NUXT_* env vars to runtimeConfig keys that already exist
    expect(defaultOptions).toHaveProperty('siteUrl', '')
  })

  it('falls back to the request host outside production', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const event = eventWithHeaders({ host: 'localhost:3000' })
    expect(getSiteUrl(event, defaultOptions)).toBe('http://localhost:3000')
  })
})
