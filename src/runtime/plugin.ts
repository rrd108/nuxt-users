import { defineNuxtPlugin, useCookie, addRouteMiddleware } from '#app'
import { useAuth } from './composables/useAuth' // We will create this

export default defineNuxtPlugin(async (nuxtApp) => {
  console.log('Plugin by nuxt-users initializing...')

  const { fetchUser, token } = useAuth()

  // Attempt to fetch user if a token exists (e.g., from a previous session)
  // The token itself is managed within useAuth via useCookie
  if (token.value) {
    console.log('Token found, attempting to fetch user...')
    await fetchUser()
  } else {
    console.log('No token found.')
  }

  // Example: Add a global route middleware to check auth on certain routes
  // addRouteMiddleware('auth-guard', (to) => {
  //   const { isAuthenticated } = useAuth()
  //   if (to.meta.requiresAuth && !isAuthenticated.value) {
  //     console.log('Route requires auth, user not authenticated. Redirecting to login.')
  //     // return navigateTo('/login') // Or your login page
  //   }
  // }, { global: true }) // Make it global or apply to specific routes

  console.log('Nuxt-users plugin initialized.')

  // Provide auth utilities to the app if needed, though composables are preferred
  // return {
  //   provide: {
  //     auth: useAuth()
  //   }
  // }
})
