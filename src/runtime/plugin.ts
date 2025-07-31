import { addRouteMiddleware, defineNuxtPlugin, useRuntimeConfig, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'
import type { ModuleOptions } from '../types'
import { checkTableExists } from '../utils'
import { useAuth } from './composables/useAuth'

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions

  const hasMigrationsTable = await checkTableExists(options, options.tables.migrations)
  if (!hasMigrationsTable) {
    console.warn('[Nuxt Users] ⚠️  Migrations table does not exist, you should run the migration script to create it by running: npx nuxt-users migrate')
  }

  addRouteMiddleware('auth.global', (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    if (to.path === '/login') {
      return
    }

    const { user } = useAuth()

    // TODO add role based access control see #55
    if (
      user.value || nuxtUsers.auth?.whitelist?.includes(to.path)
    ) {
      console.log('[Nuxt Users] 🔐 Auth middleware: Access allowed')
      return
    }

    console.log(`[Nuxt Users] 🔐 Auth middleware: Redirecting from ${from.path} to login - no user and not whitelisted`)
    return navigateTo('/login')
  },
  { global: true })
})
