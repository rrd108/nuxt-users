import { defineEventHandler } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { listPasskeys } from '../../../utils'
import { assertPasskeysEnabled, requireAuthenticatedUser, toPublicPasskey } from '../../../utils/passkey-http'

export default defineEventHandler(async (event) => {
  const options = useRuntimeConfig().nuxtUsers as ModuleOptions
  assertPasskeysEnabled(options)
  const user = requireAuthenticatedUser(event.context)

  const passkeys = await listPasskeys(options, user.id)
  return { passkeys: passkeys.map(toPublicPasskey) }
})
