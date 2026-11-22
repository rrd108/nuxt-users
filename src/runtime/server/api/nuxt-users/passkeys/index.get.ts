import { defineEventHandler } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { listPasskeys, requireSessionUser } from '../../../utils'
import { assertPasskeysEnabled, toPublicPasskey } from '../../../utils/passkey-http'

export default defineEventHandler(async (event) => {
  const options = useRuntimeConfig().nuxtUsers as ModuleOptions
  assertPasskeysEnabled(options)
  const user = await requireSessionUser(event, options)

  const passkeys = await listPasskeys(options, user.id)
  return { passkeys: passkeys.map(toPublicPasskey) }
})
