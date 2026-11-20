import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const { mockUseRuntimeConfig } = vi.hoisted(() => ({ mockUseRuntimeConfig: vi.fn() }))

vi.mock('#imports', () => ({
  useRuntimeConfig: mockUseRuntimeConfig
}))

const { default: plugin } = await import('../../src/runtime/server/plugins/validate-passkey-config')

describe('validate-passkey-config Nitro plugin', () => {
  const previousEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.NODE_ENV = 'production'
  })

  afterEach(() => {
    process.env.NODE_ENV = previousEnv
  })

  const run = (passkey?: object) => {
    mockUseRuntimeConfig.mockReturnValue({ nuxtUsers: { auth: { passkey } } })
    return (plugin as () => void)()
  }

  it('does nothing when passkeys are not enabled', () => {
    expect(() => run(undefined)).not.toThrow()
  })

  it('fails startup in production when rpId is missing', () => {
    expect(() => run({ origins: ['https://example.com'] })).toThrow(/rpId/)
  })

  it('fails startup in production when origins are missing', () => {
    expect(() => run({ rpId: 'example.com' })).toThrow(/origins/)
  })

  it('starts with a complete production config', () => {
    expect(() => run({ rpId: 'example.com', origins: ['https://example.com'] })).not.toThrow()
  })

  it('starts in development without any relying party config', () => {
    process.env.NODE_ENV = 'development'
    expect(() => run({})).not.toThrow()
  })
})
