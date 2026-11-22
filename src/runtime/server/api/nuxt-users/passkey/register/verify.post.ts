import { createError, defineEventHandler, readBody } from 'h3'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { requireSessionUser } from '../../../../utils'
import { finishPasskeyRegistration } from '../../../../services/passkey'
import { assertPasskeysEnabled, rethrowPasskeyError, toPublicPasskey } from '../../../../utils/passkey-http'

export default defineEventHandler(async (event) => {
  const options = useRuntimeConfig().nuxtUsers as ModuleOptions
  assertPasskeysEnabled(options)
  const user = await requireSessionUser(event, options)

  const body = await readBody<{ response?: RegistrationResponseJSON, name?: string }>(event)
  if (!body?.response) {
    throw createError({ statusCode: 400, statusMessage: 'Passkey response is required' })
  }

  try {
    const passkey = await finishPasskeyRegistration(options, user, body.response, body.name)
    return { passkey: toPublicPasskey(passkey) }
  }
  catch (error) {
    return rethrowPasskeyError(error)
  }
})
