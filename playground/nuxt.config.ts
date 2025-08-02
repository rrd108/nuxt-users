import { BASE_CONFIG } from '../src/constants'

export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },

  css: ['~/assets/colors.css'],
  ...BASE_CONFIG,
  nuxtUsers: {
    auth: {
      whitelist: ['/noauth'],
    },
  },
})
