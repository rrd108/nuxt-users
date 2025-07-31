import { addRouteMiddleware, defineNuxtPlugin, useRuntimeConfig, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'
import type { ModuleOptions } from '../types'
import { checkTableExists } from '../utils'
import { useAuth } from './composables/useAuth'

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { nuxtUsers } = useRuntimeConfig()
  const { public: { nuxtUsers: publicNuxtUsers } } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  const publicOptions = publicNuxtUsers as ModuleOptions

  const hasMigrationsTable = await checkTableExists(options, options.tables.migrations)
  if (!hasMigrationsTable) {
    console.warn('[Nuxt Users] ⚠️  Migrations table does not exist, you should run the migration script to create it by running: npx nuxt-users migrate')
  }

  // Initialize user from localStorage and validate with server on app startup
  const { initializeUser } = useAuth()

  // Only initialize on client-side
  if (import.meta.client) {
    await initializeUser()
  }

  addRouteMiddleware('auth.global', (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    if (to.path === '/login') {
      return
    }

    // During SSR, allow the request to proceed - authentication will be checked on client-side
    if (import.meta.server) {
      console.log('[Nuxt Users] 🔐 Auth middleware: SSR - allowing request to proceed')
      return
    }

    const { user } = useAuth()

    // TODO add role based access control see #55
    if (
      user.value || publicOptions.auth?.whitelist?.includes(to.path)
    ) {
      console.log('[Nuxt Users] 🔐 Auth middleware: Access allowed')
      return
    }

    console.log(`[Nuxt Users] 🔐 Auth middleware: Redirecting from ${from.path} to login - no user and not whitelisted`)
    return navigateTo('/login')
  },
  { global: true })

  // Add client-side only middleware for post-hydration authentication check
  if (import.meta.client) {
    addRouteMiddleware('auth.client', (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
      if (to.path === '/login') {
        return
      }

      const { user } = useAuth()

      // TODO add role based access control see #55
      if (
        user.value || publicOptions.auth?.whitelist?.includes(to.path)
      ) {
        console.log('[Nuxt Users] 🔐 Client auth middleware: Access allowed')
        return
      }

      console.log(`[Nuxt Users] 🔐 Client auth middleware: Redirecting from ${from.path} to login - no user and not whitelisted`)
      return navigateTo('/login')
    },
    { global: true })
  }
})
