import type { NitroAppPlugin } from 'nitropack'
import { useRuntimeConfig } from '#imports'
import type { ModuleOptions } from 'nuxt-users/utils'
import { runMigrations } from '../utils'

const plugin: NitroAppPlugin = async (nitroApp) => {
  const config = useRuntimeConfig()

  if (!config.nuxtUsers) {
    return
  }

  try {
    await runMigrations(config.nuxtUsers as ModuleOptions)
  }
  catch (error) {
    console.error('[Nuxt Users] Auto-migration failed:', error)
  }
}

export default plugin
