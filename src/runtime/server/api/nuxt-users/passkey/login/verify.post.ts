import { createError, defineEventHandler, readBody } from 'h3'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { createAuthTokenForUser } from '../../../../utils'
import { setAuthCookie } from '../../../../utils/auth-session'
import { finishPasskeyLogin } from '../../../../services/passkey'
import { assertPasskeysEnabled, rethrowPasskeyError } from '../../../../utils/passkey-http'

export default defineEventHandler(async (event) => {
  const options = useRuntimeConfig().nuxtUsers as ModuleOptions
  assertPasskeysEnabled(options)

  const body = await readBody<{ response?: AuthenticationResponseJSON, rememberMe?: boolean }>(event)
  if (!body?.response) {
    throw createError({ statusCode: 400, statusMessage: 'Passkey response is required' })
  }
  const rememberMe = Boolean(body.rememberMe)

  try {
    const user = await finishPasskeyLogin(options, body.response)
    const token = await createAuthTokenForUser(user, options, rememberMe, 'auth_token')
    setAuthCookie(event, token, options, rememberMe)
    return { user }
  }
  catch (error) {
    return rethrowPasskeyError(error)
  }
})
