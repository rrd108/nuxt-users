import { createError, defineEventHandler } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { deletePasskey, requireSessionUser } from '../../../utils'
import { acceptedPasskeyCredentialsFor, assertPasskeysEnabled } from '../../../utils/passkey-http'

export default defineEventHandler(async (event) => {
  const options = useRuntimeConfig().nuxtUsers as ModuleOptions
  assertPasskeysEnabled(options)
  const user = await requireSessionUser(event, options)

  const id = Number(event.context.params?.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid passkey ID' })
  }

  // Scoped to the current user: someone else's passkey looks like a missing one
  if (!await deletePasskey(options, user.id, id)) {
    throw createError({ statusCode: 404, statusMessage: 'Passkey not found' })
  }
  // The browser tells the authenticators the passkey is gone (WebAuthn Signal API), the user's others stay
  return { success: true, passkeys: await acceptedPasskeyCredentialsFor(options, user.id) }
})
