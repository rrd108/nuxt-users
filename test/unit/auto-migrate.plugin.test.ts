import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { NitroApp } from 'nitropack'

const { mockUseRuntimeConfig, mockRunMigrations } = vi.hoisted(() => ({
  mockUseRuntimeConfig: vi.fn(),
  mockRunMigrations: vi.fn()
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: mockUseRuntimeConfig
}))

vi.mock('../../src/runtime/server/utils', () => ({
  runMigrations: mockRunMigrations
}))

const createNitroApp = () => {
  const callHook = vi.fn().mockResolvedValue(undefined)
  return { nitroApp: { hooks: { callHook } } as unknown as NitroApp, callHook }
}

describe('auto-migrate Nitro plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('runs migrations and calls nuxt-users:migrated with the applied names', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nuxtUsers: { autoMigrate: true } })
    mockRunMigrations.mockResolvedValue(['create_users_table'])
    const { nitroApp, callHook } = createNitroApp()

    const { default: plugin } = await import('../../src/runtime/server/plugins/auto-migrate')
    await plugin(nitroApp)

    expect(mockRunMigrations).toHaveBeenCalledOnce()
    expect(callHook).toHaveBeenCalledWith('nuxt-users:migrated', { applied: ['create_users_table'] })
  })

  it('passes the error to nuxt-users:migrated when a migration fails', async () => {
    const error = new Error('no such table')
    mockUseRuntimeConfig.mockReturnValue({ nuxtUsers: {} })
    mockRunMigrations.mockRejectedValue(error)
    const { nitroApp, callHook } = createNitroApp()

    const { default: plugin } = await import('../../src/runtime/server/plugins/auto-migrate')
    await plugin(nitroApp)

    expect(callHook).toHaveBeenCalledWith('nuxt-users:migrated', { applied: [], error })
  })

  it('does nothing when autoMigrate is false', async () => {
    mockUseRuntimeConfig.mockReturnValue({ nuxtUsers: { autoMigrate: false } })
    const { nitroApp, callHook } = createNitroApp()

    const { default: plugin } = await import('../../src/runtime/server/plugins/auto-migrate')
    await plugin(nitroApp)

    expect(mockRunMigrations).not.toHaveBeenCalled()
    expect(callHook).not.toHaveBeenCalled()
  })
})
