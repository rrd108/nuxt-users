import type { NitroAppPlugin } from 'nitropack'
import { useRuntimeConfig } from '#imports'
import type { ModuleOptions } from 'nuxt-users/utils'
import { resolvePasskeyConfig } from '../services/passkey'

// Fails startup when passkeys are enabled in production without an explicit relying party:
// passkeys are bound to rpId, so a wrong guess would silently lock users out later.
const plugin: NitroAppPlugin = () => {
  const options = useRuntimeConfig().nuxtUsers as ModuleOptions | undefined
  if (!options?.auth?.passkey) {
    return
  }
  resolvePasskeyConfig(options)
}

export default plugin
