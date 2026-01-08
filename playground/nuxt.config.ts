import { BASE_CONFIG } from '../src/constants'

export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },

  ...BASE_CONFIG,
  nuxtUsers: {
    emailConfirmationUrl: '/email-confirmation',
    auth: {
      whitelist: ['/noauth', '/register', '/email-confirmation'],
      tokenExpiration: 10,
      rememberMeExpiration: 30, // Added to satisfy ModuleOptions
      permissions: {
        admin: ['*'],
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || 'google-client-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'google-client-secret',
        successRedirect: '/',
        errorRedirect: '/login?error=oauth_failed'
      }
    },
    passwordValidation: {
      minLength: 3,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
      preventCommonPasswords: false,
    }
  },
})
