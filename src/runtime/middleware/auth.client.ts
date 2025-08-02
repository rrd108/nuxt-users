import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#app'
import { useAuth } from '../composables/useAuth'

import type { ModuleOptions } from '../../types'

export default defineNuxtRouteMiddleware((to) => {
  const { public: { nuxtUsers: publicNuxtUsers } } = useRuntimeConfig()
  const publicOptions = publicNuxtUsers as ModuleOptions

  // login page is allowed to access without authentication
  if (to.path === '/login') {
    console.log('[Nuxt Users] client.middleware.auth.global: /login')
    return
  }

  // whitelisted paths are allowed to access without authentication
  if (publicOptions.auth.whitelist.includes(to.path)) {
    console.log(`[Nuxt Users] client.middleware.auth.global: Whitelisted: ${to.path}`)
    return
  }

  const { user } = useAuth()
  if (!user.value?.id) {
    console.log('[Nuxt Users] client.middleware.auth.global: Unauthenticated, redirecting to /login')
    return navigateTo('/login')
  }

  console.log('[Nuxt Users] client.middleware.auth.global', { user: user.value?.id, to: to.path })
})
