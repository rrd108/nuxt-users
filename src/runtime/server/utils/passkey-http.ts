import { createError } from 'h3'
import type { ModuleOptions, UserWithoutPassword } from 'nuxt-users/utils'
import { PasskeyError } from '../services/passkey'
import type { Passkey } from './passkey'

/** Passkeys are an opt-in feature: without auth.passkey every passkey endpoint answers 404 */
export const assertPasskeysEnabled = (options: ModuleOptions) => {
  if (!options.auth.passkey) {
    throw createError({ statusCode: 404, statusMessage: 'Passkeys are not enabled' })
  }
}

/** The user the authorization middleware stored in the event context */
export const requireAuthenticatedUser = (context: object | undefined): UserWithoutPassword => {
  const user = (context as { nuxtUsers?: { user?: UserWithoutPassword } } | undefined)?.nuxtUsers?.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
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
    throw createError({ statusCode: error.statusCode, statusMessage: error.message })
  }
  console.error('[Nuxt Users] Passkey error:', error)
  throw createError({ statusCode: 500, statusMessage: 'Passkey request failed' })
}
