import type { NitroAppPlugin } from 'nitropack'
import { useRuntimeConfig } from '#imports'
import type { ModuleOptions } from 'nuxt-users/utils'
import { runMigrations } from '../utils'

const plugin: NitroAppPlugin = async (nitroApp) => {
  const config = useRuntimeConfig()

  if (!config.nuxtUsers) {
    return
  }

  const options = config.nuxtUsers as ModuleOptions

  if (options.autoMigrate === false) {
    return
  }

  try {
    const applied = await runMigrations(options)
    await nitroApp.hooks.callHook('nuxt-users:migrated', { applied })
  }
  catch (error) {
    console.error('[Nuxt Users] Auto-migration failed:', error)
    await nitroApp.hooks.callHook('nuxt-users:migrated', { applied: [], error })
  }
}

export default plugin
