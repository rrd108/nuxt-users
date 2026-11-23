import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { H3Event } from 'h3'
import type { UserWithoutPassword } from '../../src/types'
import { defaultOptions } from '../../src/module'

const passkeyOptions = { ...defaultOptions, auth: { ...defaultOptions.auth, passkey: { rpId: 'example.com', origins: ['https://example.com'] } } }
let currentOptions: typeof passkeyOptions | typeof defaultOptions = passkeyOptions

vi.mock('h3', () => ({
  defineEventHandler: vi.fn(handler => handler),
  readBody: vi.fn(),
  setCookie: vi.fn(),
  createError: vi.fn((e) => {
    throw e
  })
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn(() => ({ nuxtUsers: currentOptions }))
}))

vi.mock('../../src/runtime/server/utils', () => ({
  listPasskeys: vi.fn(),
  deletePasskey: vi.fn(),
  startSession: vi.fn(),
  // The session is the user the authorization middleware left in the context
  requireSessionUser: vi.fn(async (event: { context?: { nuxtUsers?: { user?: unknown } } }) => {
    const user = event.context?.nuxtUsers?.user
    if (!user) {
      throw { statusCode: 401 }
    }
    return user
  }),
}))

vi.mock('../../src/runtime/server/services/passkey', () => {
  class PasskeyError extends Error {
    statusCode: number
    constructor(message: string, statusCode: number) {
      super(message)
      this.statusCode = statusCode
    }
  }
  return {
    PasskeyError,
    beginPasskeyRegistration: vi.fn(),
    finishPasskeyRegistration: vi.fn(),
    beginPasskeyLogin: vi.fn(),
    finishPasskeyLogin: vi.fn(),
    getAcceptedPasskeyCredentials: vi.fn(),
  }
})

const registerOptions = await import('../../src/runtime/server/api/nuxt-users/passkey/register/options.post')
const registerVerify = await import('../../src/runtime/server/api/nuxt-users/passkey/register/verify.post')
const loginOptions = await import('../../src/runtime/server/api/nuxt-users/passkey/login/options.post')
const loginVerify = await import('../../src/runtime/server/api/nuxt-users/passkey/login/verify.post')
const listEndpoint = await import('../../src/runtime/server/api/nuxt-users/passkeys/index.get')
const deleteEndpoint = await import('../../src/runtime/server/api/nuxt-users/passkeys/[id].delete')

describe('Passkey API endpoints', () => {
  const user: UserWithoutPassword = { id: 7, email: 'me@example.com', name: 'Me', role: 'user', created_at: '', updated_at: '', active: true }
  const authed = { context: { nuxtUsers: { user } } } as unknown as H3Event
  const anonymous = { context: {} } as unknown as H3Event
  const withId = (id: string, authenticated = true) => ({ context: { params: { id }, ...(authenticated && { nuxtUsers: { user } }) } }) as unknown as H3Event

  const storedPasskey = {
    id: 1, user_id: 7, credential_id: 'cred', public_key: 'secret-key', counter: 3, transports: ['internal'],
    device_type: 'multiDevice', backed_up: true, name: 'Laptop', user_handle: 'secret-handle', created_at: '2026-01-01', last_used_at: null,
  }

  // The passkeys the user still has, for the browser's Signal API
  const accepted = { rpId: 'example.com', userId: 'handle', allAcceptedCredentialIds: ['cred', 'phone-cred'] }

  let h3: typeof import('h3')
  let utils: typeof import('../../src/runtime/server/utils')
  let service: typeof import('../../src/runtime/server/services/passkey')

  beforeEach(async () => {
    vi.clearAllMocks()
    currentOptions = passkeyOptions
    h3 = await import('h3')
    utils = await import('../../src/runtime/server/utils')
    service = await import('../../src/runtime/server/services/passkey')
  })

  describe('when passkeys are disabled', () => {
    beforeEach(() => {
      currentOptions = defaultOptions
    })

    it.each([
      ['register options', () => registerOptions.default(authed)],
      ['register verify', () => registerVerify.default(authed)],
      ['login options', () => loginOptions.default(anonymous)],
      ['login verify', () => loginVerify.default(anonymous)],
      ['list', () => listEndpoint.default(authed)],
      ['delete', () => deleteEndpoint.default(withId('1'))],
    ])('answers 404 for %s', async (_name, call) => {
      await expect(call()).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('registration', () => {
    it('requires an authenticated user', async () => {
      await expect(registerOptions.default(anonymous)).rejects.toMatchObject({ statusCode: 401 })
      vi.mocked(h3.readBody).mockResolvedValue({ response: {} })
      await expect(registerVerify.default(anonymous)).rejects.toMatchObject({ statusCode: 401 })
      expect(service.beginPasskeyRegistration).not.toHaveBeenCalled()
      expect(service.finishPasskeyRegistration).not.toHaveBeenCalled()
    })

    it('returns the registration options for the current user', async () => {
      vi.mocked(service.beginPasskeyRegistration).mockResolvedValue({ challenge: 'c' } as never)

      expect(await registerOptions.default(authed)).toEqual({ challenge: 'c' })
      expect(service.beginPasskeyRegistration).toHaveBeenCalledWith(passkeyOptions, user)
    })

    it('saves a verified passkey without exposing its key material', async () => {
      vi.mocked(h3.readBody).mockResolvedValue({ response: { id: 'cred' }, name: 'Laptop' })
      vi.mocked(service.finishPasskeyRegistration).mockResolvedValue(storedPasskey as never)

      const result = await registerVerify.default(authed)

      expect(service.finishPasskeyRegistration).toHaveBeenCalledWith(passkeyOptions, user, { id: 'cred' }, 'Laptop')
      expect(result.passkey).toEqual({ id: 1, name: 'Laptop', device_type: 'multiDevice', backed_up: true, transports: ['internal'], created_at: '2026-01-01', last_used_at: null })
    })

    it('answers 400 without a response body', async () => {
      vi.mocked(h3.readBody).mockResolvedValue({})

      await expect(registerVerify.default(authed)).rejects.toMatchObject({ statusCode: 400 })
    })

    it('maps a failed ceremony to its status', async () => {
      vi.mocked(h3.readBody).mockResolvedValue({ response: {} })
      vi.mocked(service.finishPasskeyRegistration).mockRejectedValue(new service.PasskeyError('nope', 400))

      await expect(registerVerify.default(authed)).rejects.toMatchObject({ statusCode: 400, statusMessage: 'nope' })
    })
  })

  describe('login', () => {
    it('is reachable without authentication', async () => {
      vi.mocked(service.beginPasskeyLogin).mockResolvedValue({ challenge: 'c' } as never)

      expect(await loginOptions.default(anonymous)).toEqual({ challenge: 'c' })
    })

    it('starts a passkey session like a password login', async () => {
      vi.mocked(h3.readBody).mockResolvedValue({ response: { id: 'cred' }, rememberMe: true })
      vi.mocked(service.finishPasskeyLogin).mockResolvedValue(user)
      vi.mocked(utils.startSession).mockResolvedValue('the-token')
      vi.mocked(service.getAcceptedPasskeyCredentials).mockResolvedValue(accepted)

      const result = await loginVerify.default(anonymous)

      expect(utils.startSession).toHaveBeenCalledWith(anonymous, user, 'passkey', passkeyOptions, true)
      expect(service.getAcceptedPasskeyCredentials).toHaveBeenCalledWith(passkeyOptions, 7)
      expect(result).toEqual({ user, passkeys: accepted })
    })

    it('passes the session refusal of an inactive user through', async () => {
      vi.mocked(h3.readBody).mockResolvedValue({ response: { id: 'cred' } })
      vi.mocked(service.finishPasskeyLogin).mockResolvedValue({ ...user, active: false })
      vi.mocked(utils.startSession).mockRejectedValue({ statusCode: 403, statusMessage: 'User account is inactive' })

      await expect(loginVerify.default(anonymous)).rejects.toMatchObject({ statusCode: 403 })
    })

    it('does not issue a token when the passkey is rejected', async () => {
      vi.mocked(h3.readBody).mockResolvedValue({ response: {} })
      vi.mocked(service.finishPasskeyLogin).mockRejectedValue(new service.PasskeyError('Invalid passkey', 401))

      await expect(loginVerify.default(anonymous)).rejects.toMatchObject({ statusCode: 401 })
      expect(utils.startSession).not.toHaveBeenCalled()
    })
  })

  describe('management', () => {
    it('lists only the current user passkeys, without key material', async () => {
      vi.mocked(utils.listPasskeys).mockResolvedValue([storedPasskey] as never)

      const result = await listEndpoint.default(authed)

      expect(utils.listPasskeys).toHaveBeenCalledWith(passkeyOptions, 7)
      expect(result.passkeys).toEqual([expect.not.objectContaining({ public_key: expect.anything(), user_handle: expect.anything(), credential_id: expect.anything() })])
      expect(result.passkeys[0]).toMatchObject({ id: 1, name: 'Laptop' })
    })

    it('requires an authenticated user to list and delete', async () => {
      await expect(listEndpoint.default(anonymous)).rejects.toMatchObject({ statusCode: 401 })
      await expect(deleteEndpoint.default(withId('1', false))).rejects.toMatchObject({ statusCode: 401 })
    })

    it('deletes a passkey of the current user', async () => {
      vi.mocked(utils.deletePasskey).mockResolvedValue(true)
      vi.mocked(service.getAcceptedPasskeyCredentials).mockResolvedValue(accepted)

      expect(await deleteEndpoint.default(withId('1'))).toEqual({ success: true, passkeys: accepted })
    })

    it('still answers the delete and the login when the remaining passkeys cannot be read', async () => {
      vi.mocked(utils.deletePasskey).mockResolvedValue(true)
      vi.mocked(service.getAcceptedPasskeyCredentials).mockRejectedValue(new Error('db down'))
      expect(await deleteEndpoint.default(withId('1'))).toEqual({ success: true, passkeys: null })

      vi.mocked(h3.readBody).mockResolvedValue({ response: { id: 'cred' } })
      vi.mocked(service.finishPasskeyLogin).mockResolvedValue(user)
      vi.mocked(utils.startSession).mockResolvedValue('the-token')
      expect(await loginVerify.default(anonymous)).toEqual({ user, passkeys: null })
      expect(utils.deletePasskey).toHaveBeenCalledWith(passkeyOptions, 7, 1)
    })

    it('answers 404 for a passkey of someone else', async () => {
      vi.mocked(utils.deletePasskey).mockResolvedValue(false)

      await expect(deleteEndpoint.default(withId('2'))).rejects.toMatchObject({ statusCode: 404 })
    })

    it('answers 400 for a non numeric id', async () => {
      await expect(deleteEndpoint.default(withId('abc'))).rejects.toMatchObject({ statusCode: 400 })
      expect(utils.deletePasskey).not.toHaveBeenCalled()
    })
  })
})
