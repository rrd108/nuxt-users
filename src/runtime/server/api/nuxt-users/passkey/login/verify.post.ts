import { createError, defineEventHandler, readBody } from 'h3'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import type { ModuleOptions, UserWithoutPassword } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { startSession } from '../../../../utils'
import { finishPasskeyLogin } from '../../../../services/passkey'
import { acceptedPasskeyCredentialsFor, assertPasskeysEnabled, rethrowPasskeyError } from '../../../../utils/passkey-http'

export default defineEventHandler(async (event) => {
  const options = useRuntimeConfig().nuxtUsers as ModuleOptions
  assertPasskeysEnabled(options)

  const body = await readBody<{ response?: AuthenticationResponseJSON, rememberMe?: boolean }>(event)
  if (!body?.response) {
    throw createError({ statusCode: 400, statusMessage: 'Passkey response is required' })
  }
  const rememberMe = Boolean(body.rememberMe)

  let user: UserWithoutPassword
  try {
    user = await finishPasskeyLogin(options, body.response)
  }
  catch (error) {
    return rethrowPasskeyError(error)
  }

  await startSession(event, user, 'passkey', options, rememberMe)
  // The browser tells the authenticators which of the user's passkeys still exist (WebAuthn Signal API)
  return { user, passkeys: await acceptedPasskeyCredentialsFor(options, user.id) }
})
