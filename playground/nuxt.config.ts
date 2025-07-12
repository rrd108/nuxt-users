export default defineNuxtConfig({
  modules: ['../src/module', '@formkit/nuxt'],
  devtools: { enabled: true },
  compatibilityDate: '2025-07-08',
  nuxtUsers: {
    oauth: {
      google: {
        clientId: 'your-google-client-id',
        clientSecret: 'your-google-client-secret',
        redirectUri: 'http://localhost:3000/api/auth/google/callback',
        scope: ['email', 'profile'],
      },
    },
  },
})
