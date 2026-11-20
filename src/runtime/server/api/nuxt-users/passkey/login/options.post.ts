import { defineEventHandler } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { beginPasskeyLogin } from '../../../../services/passkey'
import { assertPasskeysEnabled, rethrowPasskeyError } from '../../../../utils/passkey-http'

export default defineEventHandler(async () => {
  const options = useRuntimeConfig().nuxtUsers as ModuleOptions
  assertPasskeysEnabled(options)

  try {
    return await beginPasskeyLogin(options)
  }
  catch (error) {
    return rethrowPasskeyError(error)
  }
})
