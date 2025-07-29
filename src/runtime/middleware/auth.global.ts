import { defineNuxtRouteMiddleware, useRuntimeConfig, navigateTo } from '#app'

export default defineNuxtRouteMiddleware((to, _from) => {
  const { nuxtUsers } = useRuntimeConfig()
  const { user } = useAuth()

  if (
    !user.value
    && !nuxtUsers.auth.whitelist.includes(to.path)
  ) {
    return navigateTo(nuxtUsers.auth.whitelist[0] || '/login')
  }
})
