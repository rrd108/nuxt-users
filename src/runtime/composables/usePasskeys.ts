import { computed, getCurrentInstance, onMounted, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import type { PasskeyAcceptedCredentials, PasskeySummary, PasskeyUnknownCredential, RuntimeModuleOptions, UserWithoutPassword } from 'nuxt-users/utils'

/** The browser aborted the ceremony: the user dismissed the prompt, or it timed out */
const isCancelled = (error: unknown) => error instanceof Error && (error.name === 'NotAllowedError' || error.name === 'AbortError')

/** The `data` the server attached to an HTTP error ($fetch puts the response body on `error.data`) */
const unknownCredentialOf = (error: unknown): PasskeyUnknownCredential | null => {
  const data = (error as { data?: { data?: Partial<PasskeyUnknownCredential> } } | null)?.data?.data
  return data?.code === 'unknown_credential' && data.rpId && data.credentialId ? data as PasskeyUnknownCredential : null
}

// The WebAuthn Signal API, not in every browser (nor in the DOM typings) yet
interface SignalApi {
  signalUnknownCredential?: (options: Omit<PasskeyUnknownCredential, 'code'>) => Promise<void>
  signalAllAcceptCredentials?: (options: PasskeyAcceptedCredentials) => Promise<void>
}

/**
 * Tells the authenticators about passkeys the server no longer has, so they disappear from the device.
 * Best effort: a browser without the Signal API, or one that refuses, changes nothing for the user.
 */
const signal = async <K extends keyof SignalApi>(method: K, options: Parameters<NonNullable<SignalApi[K]>>[0]) => {
  const api = (globalThis as { PublicKeyCredential?: SignalApi }).PublicKeyCredential
  const fn = api?.[method] as ((options: unknown) => Promise<void>) | undefined
  if (typeof fn !== 'function') {
    return
  }
  try {
    await fn.call(api, options)
  }
  catch (error) {
    console.warn(`[Nuxt Users] PublicKeyCredential.${method} failed:`, error)
  }
}

/**
 * Passkey (WebAuthn) login and management for the signed-in user.
 *
 * `login` only returns the user, like the password login form does: call `useAuthentication().login(user)`
 * with it (or use the `success` event of `NUsersLoginForm` / `NUsersPasskeyLoginButton`).
 */
export const usePasskeys = () => {
  const { public: { nuxtUsers } } = useRuntimeConfig()
  const { apiBasePath, auth } = nuxtUsers as RuntimeModuleOptions

  /** Passkeys are turned on in the module config (auth.passkey) */
  const enabled = computed(() => Boolean(auth?.passkey))

  // Only known after mount, so server and client render the same markup
  const supported = ref(false)
  const detectSupport = () => {
    supported.value = typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined'
  }
  if (getCurrentInstance()) {
    onMounted(detectSupport)
  }
  else {
    detectSupport()
  }

  /** Signs in with a passkey. Resolves to null when the user dismissed the browser prompt. */
  const login = async (rememberMe = false): Promise<UserWithoutPassword | null> => {
    const { startAuthentication } = await import('@simplewebauthn/browser')
    const optionsJSON = await $fetch<Parameters<typeof startAuthentication>[0]['optionsJSON']>(`${apiBasePath}/passkey/login/options`, { method: 'POST' })

    let response
    try {
      response = await startAuthentication({ optionsJSON })
    }
    catch (error) {
      if (isCancelled(error)) {
        return null
      }
      throw error
    }

    let result
    try {
      result = await $fetch<{ user: UserWithoutPassword, passkeys?: PasskeyAcceptedCredentials | null }>(`${apiBasePath}/passkey/login/verify`, {
        method: 'POST',
        body: { response, rememberMe }
      })
    }
    catch (error) {
      // The passkey was removed on the server: the device would keep offering it
      const unknown = unknownCredentialOf(error)
      if (unknown) {
        const { code: _, ...credential } = unknown
        await signal('signalUnknownCredential', credential)
      }
      throw error
    }

    if (result.passkeys) {
      await signal('signalAllAcceptCredentials', result.passkeys)
    }
    return result.user
  }

  /** The login was refused because the server does not know the passkey: it was removed */
  const isUnknownPasskey = (error: unknown): boolean => unknownCredentialOf(error) !== null

  /** Adds a passkey to the signed-in user. Resolves to null when the user dismissed the browser prompt. */
  const register = async (name?: string): Promise<PasskeySummary | null> => {
    const { startRegistration } = await import('@simplewebauthn/browser')
    const optionsJSON = await $fetch<Parameters<typeof startRegistration>[0]['optionsJSON']>(`${apiBasePath}/passkey/register/options`, { method: 'POST' })

    let response
    try {
      response = await startRegistration({ optionsJSON })
    }
    catch (error) {
      if (isCancelled(error)) {
        return null
      }
      throw error
    }

    const result = await $fetch<{ passkey: PasskeySummary }>(`${apiBasePath}/passkey/register/verify`, {
      method: 'POST',
      body: { response, name }
    })
    return result.passkey
  }

  const list = async (): Promise<PasskeySummary[]> => {
    const result = await $fetch<{ passkeys: PasskeySummary[] }>(`${apiBasePath}/passkeys`)
    return result.passkeys
  }

  /** Removes a passkey, and asks the authenticators to drop it while keeping the user's other passkeys */
  const remove = async (id: number): Promise<void> => {
    const result = await $fetch<{ success: boolean, passkeys?: PasskeyAcceptedCredentials | null }>(`${apiBasePath}/passkeys/${id}`, { method: 'DELETE' })
    if (result?.passkeys) {
      await signal('signalAllAcceptCredentials', result.passkeys)
    }
  }

  return { enabled, supported, login, isUnknownPasskey, register, list, remove }
}
