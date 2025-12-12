import { defineNuxtPlugin } from '#app'
import { useAuthentication } from './composables/useAuthentication'

export default defineNuxtPlugin(async () => {
  // Auto-initialize user on app startup (client-side only)
  // This ensures session is restored when opening new tabs
  const { initializeUser } = useAuthentication()
  await initializeUser()
})
