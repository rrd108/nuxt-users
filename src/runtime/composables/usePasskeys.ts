import { computed, getCurrentInstance, onMounted, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import type { PasskeySummary, RuntimeModuleOptions, UserWithoutPassword } from 'nuxt-users/utils'

/** The browser aborted the ceremony: the user dismissed the prompt, or it timed out */
const isCancelled = (error: unknown) => error instanceof Error && (error.name === 'NotAllowedError' || error.name === 'AbortError')

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

    const result = await $fetch<{ user: UserWithoutPassword }>(`${apiBasePath}/passkey/login/verify`, {
      method: 'POST',
      body: { response, rememberMe }
    })
    return result.user
  }

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

  const remove = async (id: number): Promise<void> => {
    await $fetch(`${apiBasePath}/passkeys/${id}`, { method: 'DELETE' })
  }

  return { enabled, supported, login, register, list, remove }
}
