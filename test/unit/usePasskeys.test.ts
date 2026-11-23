import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: { auth: { passkey: {} } as { passkey?: object } }
}))

vi.mock('#app', () => ({
  useRuntimeConfig: () => ({ public: { nuxtUsers: { apiBasePath: '/api/nuxt-users', auth: mockConfig.auth } } })
}))

const { startAuthentication, startRegistration } = vi.hoisted(() => ({
  startAuthentication: vi.fn(),
  startRegistration: vi.fn()
}))
vi.mock('@simplewebauthn/browser', () => ({ startAuthentication, startRegistration }))

const mockFetch = vi.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.$fetch = mockFetch as any

const { usePasskeys } = await import('../../src/runtime/composables/usePasskeys')

const cancelled = () => Object.assign(new Error('cancelled'), { name: 'NotAllowedError' })

// What $fetch throws for an h3 error: the response body (statusMessage, data, ...) is on `data`
const httpError = (statusCode: number, statusMessage: string, data?: object) =>
  Object.assign(new Error(statusMessage), { statusCode, data: { statusCode, statusMessage, data } })

const unknownCredential = { code: 'unknown_credential', rpId: 'example.com', credentialId: 'stale-cred' }
const accepted = { rpId: 'example.com', userId: 'handle', allAcceptedCredentialIds: ['laptop-cred', 'phone-cred'] }

const signalUnknownCredential = vi.fn()
const signalAllAcceptCredentials = vi.fn()
const withSignalApi = () => {
  vi.stubGlobal('PublicKeyCredential', { signalUnknownCredential, signalAllAcceptCredentials })
}

describe('usePasskeys', () => {
  const user = { id: 1, email: 'a@b.c' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    mockConfig.auth = { passkey: {} }
  })

  describe('enabled', () => {
    it('follows auth.passkey in the public config', () => {
      expect(usePasskeys().enabled.value).toBe(true)
      mockConfig.auth = {}
      expect(usePasskeys().enabled.value).toBe(false)
    })
  })

  describe('login', () => {
    it('runs the ceremony against the login endpoints and returns the user', async () => {
      mockFetch.mockResolvedValueOnce({ challenge: 'c' }).mockResolvedValueOnce({ user })
      startAuthentication.mockResolvedValue({ id: 'cred' })

      expect(await usePasskeys().login(true)).toEqual(user)

      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/nuxt-users/passkey/login/options', { method: 'POST' })
      expect(startAuthentication).toHaveBeenCalledWith({ optionsJSON: { challenge: 'c' } })
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/nuxt-users/passkey/login/verify', { method: 'POST', body: { response: { id: 'cred' }, rememberMe: true } })
    })

    it('resolves to null, without calling the server again, when the user dismisses the prompt', async () => {
      mockFetch.mockResolvedValueOnce({ challenge: 'c' })
      startAuthentication.mockRejectedValue(cancelled())

      expect(await usePasskeys().login()).toBeNull()
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('rethrows other ceremony errors', async () => {
      mockFetch.mockResolvedValueOnce({ challenge: 'c' })
      startAuthentication.mockRejectedValue(new Error('boom'))

      await expect(usePasskeys().login()).rejects.toThrow('boom')
    })

    it('tells the authenticators which passkeys of the user still exist after a login', async () => {
      withSignalApi()
      mockFetch.mockResolvedValueOnce({ challenge: 'c' }).mockResolvedValueOnce({ user, passkeys: accepted })
      startAuthentication.mockResolvedValue({ id: 'laptop-cred' })

      expect(await usePasskeys().login()).toEqual(user)
      expect(signalAllAcceptCredentials).toHaveBeenCalledWith(accepted)
    })

    it('tells the authenticator to forget a passkey the server does not know, and rethrows', async () => {
      withSignalApi()
      const error = httpError(401, 'Unknown passkey', unknownCredential)
      mockFetch.mockResolvedValueOnce({ challenge: 'c' }).mockRejectedValueOnce(error)
      startAuthentication.mockResolvedValue({ id: 'stale-cred' })

      await expect(usePasskeys().login()).rejects.toBe(error)
      expect(signalUnknownCredential).toHaveBeenCalledWith({ rpId: 'example.com', credentialId: 'stale-cred' })
    })

    it('signals nothing for other login failures', async () => {
      withSignalApi()
      mockFetch.mockResolvedValueOnce({ challenge: 'c' }).mockRejectedValueOnce(httpError(401, 'Invalid passkey'))
      startAuthentication.mockResolvedValue({ id: 'cred' })

      await expect(usePasskeys().login()).rejects.toMatchObject({ statusCode: 401 })
      expect(signalUnknownCredential).not.toHaveBeenCalled()
    })

    it('works in browsers without the Signal API', async () => {
      vi.stubGlobal('PublicKeyCredential', {})
      mockFetch.mockResolvedValueOnce({ challenge: 'c' }).mockResolvedValueOnce({ user, passkeys: accepted })
      startAuthentication.mockResolvedValue({ id: 'cred' })
      expect(await usePasskeys().login()).toEqual(user)

      const error = httpError(401, 'Unknown passkey', unknownCredential)
      mockFetch.mockResolvedValueOnce({ challenge: 'c' }).mockRejectedValueOnce(error)
      await expect(usePasskeys().login()).rejects.toBe(error)
    })

    it('does not fail the login when the Signal API throws', async () => {
      withSignalApi()
      signalAllAcceptCredentials.mockRejectedValueOnce(new Error('not allowed'))
      mockFetch.mockResolvedValueOnce({ challenge: 'c' }).mockResolvedValueOnce({ user, passkeys: accepted })
      startAuthentication.mockResolvedValue({ id: 'cred' })

      expect(await usePasskeys().login()).toEqual(user)
    })

    it('recognises the unknown passkey error, so the UI can explain it', () => {
      const { isUnknownPasskey } = usePasskeys()
      expect(isUnknownPasskey(httpError(401, 'Unknown passkey', unknownCredential))).toBe(true)
      expect(isUnknownPasskey(httpError(401, 'Invalid passkey'))).toBe(false)
      expect(isUnknownPasskey(new Error('boom'))).toBe(false)
    })
  })

  describe('register', () => {
    it('runs the ceremony against the register endpoints and returns the passkey', async () => {
      mockFetch.mockResolvedValueOnce({ challenge: 'c' }).mockResolvedValueOnce({ passkey: { id: 4, name: 'Laptop' } })
      startRegistration.mockResolvedValue({ id: 'new' })

      expect(await usePasskeys().register('Laptop')).toEqual({ id: 4, name: 'Laptop' })

      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/nuxt-users/passkey/register/options', { method: 'POST' })
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/nuxt-users/passkey/register/verify', { method: 'POST', body: { response: { id: 'new' }, name: 'Laptop' } })
    })

    it('resolves to null when the user dismisses the prompt', async () => {
      mockFetch.mockResolvedValueOnce({ challenge: 'c' })
      startRegistration.mockRejectedValue(cancelled())

      expect(await usePasskeys().register()).toBeNull()
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('rethrows an already registered authenticator so the UI can explain it', async () => {
      mockFetch.mockResolvedValueOnce({ challenge: 'c' })
      startRegistration.mockRejectedValue(Object.assign(new Error('exists'), { name: 'InvalidStateError' }))

      await expect(usePasskeys().register()).rejects.toMatchObject({ name: 'InvalidStateError' })
    })
  })

  describe('management', () => {
    it('lists passkeys', async () => {
      mockFetch.mockResolvedValueOnce({ passkeys: [{ id: 1 }] })

      expect(await usePasskeys().list()).toEqual([{ id: 1 }])
      expect(mockFetch).toHaveBeenCalledWith('/api/nuxt-users/passkeys')
    })

    it('removes a passkey', async () => {
      mockFetch.mockResolvedValueOnce({ success: true })

      await usePasskeys().remove(9)

      expect(mockFetch).toHaveBeenCalledWith('/api/nuxt-users/passkeys/9', { method: 'DELETE' })
    })

    it('tells the authenticators the removed passkey is gone and the others stay', async () => {
      withSignalApi()
      mockFetch.mockResolvedValueOnce({ success: true, passkeys: { ...accepted, allAcceptedCredentialIds: ['phone-cred'] } })

      await usePasskeys().remove(9)

      expect(signalAllAcceptCredentials).toHaveBeenCalledWith({ rpId: 'example.com', userId: 'handle', allAcceptedCredentialIds: ['phone-cred'] })
    })
  })
})
