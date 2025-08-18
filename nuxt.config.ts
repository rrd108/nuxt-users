import { BASE_CONFIG } from './src/constants'

export default defineNuxtConfig({
  ...BASE_CONFIG,
  devtools: { enabled: true },
  modules: ['./src/module'],
  nitro: {
    experimental: {
      database: true,
    },
  },
})
