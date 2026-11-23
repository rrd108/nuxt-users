import { createError } from 'h3'
import type { ModuleOptions, PasskeyAcceptedCredentials } from 'nuxt-users/utils'
import { getAcceptedPasskeyCredentials, PasskeyError } from '../services/passkey'
import type { Passkey } from './passkey'

/** Passkeys are an opt-in feature: without auth.passkey every passkey endpoint answers 404 */
export const assertPasskeysEnabled = (options: ModuleOptions) => {
  if (!options.auth.passkey) {
    throw createError({ statusCode: 404, statusMessage: 'Passkeys are not enabled' })
  }
}

/** What the API shows of a passkey: never the public key, credential id or user handle */
export const toPublicPasskey = (passkey: Passkey) => ({
  id: passkey.id,
  name: passkey.name,
  device_type: passkey.device_type,
  backed_up: passkey.backed_up,
  transports: passkey.transports,
  created_at: passkey.created_at,
  last_used_at: passkey.last_used_at,
})

/** Turns an expected passkey ceremony failure into an HTTP error, and lets anything else bubble up as a 500 */
export const rethrowPasskeyError = (error: unknown): never => {
  if (error instanceof PasskeyError) {
    throw createError({ statusCode: error.statusCode, statusMessage: error.message, data: error.data })
  }
  console.error('[Nuxt Users] Passkey error:', error)
  throw createError({ statusCode: 500, statusMessage: 'Passkey request failed' })
}

/**
 * The user's remaining passkeys for the browser's Signal API, or null if they cannot be read. Best effort:
 * it runs after the login or delete already happened, which must not turn into an error.
 */
export const acceptedPasskeyCredentialsFor = async (options: ModuleOptions, userId: number): Promise<PasskeyAcceptedCredentials | null> => {
  try {
    return await getAcceptedPasskeyCredentials(options, userId)
  }
  catch (error) {
    console.warn('[Nuxt Users] Could not list the accepted passkeys for the Signal API:', error)
    return null
  }
}
