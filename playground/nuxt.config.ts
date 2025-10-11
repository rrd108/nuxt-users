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
      // TODO: if it is uncommented it makes `yarn test:types` fails - for some unknown reason
      // INFO: if it is commented out you can not login to the playground
      /* permissions: {
        admin: ['*'],
      }, */
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || 'demo-client-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-client-secret',
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
