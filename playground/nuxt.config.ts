import { BASE_CONFIG } from '../src/constants'

export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },

  ...BASE_CONFIG,
  nuxtUsers: {
    emailConfirmationUrl: '/email-confirmation',
    auth: {
      whitelist: ['/noauth', '/register', '/email-confirmation', '/profile'],
      tokenExpiration: 10,
      rememberMeExpiration: 30, // Added to satisfy ModuleOptions
      permissions: {
        admin: ['*'],
      },
      // Passkeys work on localhost over plain http. rpId and origins are only required for production builds
      // (the integration test serves one), so they are set explicitly here.
      passkey: {
        rpName: 'Nuxt Users Playground',
        rpId: 'localhost',
        origins: ['http://localhost:3000'],
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
