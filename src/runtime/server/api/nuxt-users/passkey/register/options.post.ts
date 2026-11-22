import { defineEventHandler } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { requireSessionUser } from '../../../../utils'
import { beginPasskeyRegistration } from '../../../../services/passkey'
import { assertPasskeysEnabled, rethrowPasskeyError } from '../../../../utils/passkey-http'

export default defineEventHandler(async (event) => {
  const options = useRuntimeConfig().nuxtUsers as ModuleOptions
  assertPasskeysEnabled(options)
  const user = await requireSessionUser(event, options)

  try {
    return await beginPasskeyRegistration(options, user)
  }
  catch (error) {
    return rethrowPasskeyError(error)
  }
})
