import { BASE_CONFIG } from '../src/constants'

export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },

  css: ['~/assets/colors.css'],
  ...BASE_CONFIG,
  nuxtUsers: {
    auth: {
      whitelist: ['/noauth'],
      tokenExpiration: 10,
      // this makes the tests fails for some unknown reason
      // permissions: {
      //   admin: ['*'],
      // },
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
