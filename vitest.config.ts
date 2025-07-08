import { defineConfig } from 'vitest/config'
import NuxtVitest from 'vite-plugin-nuxt-test'

export default defineConfig({
  plugins: [
    // NuxtVitest() // This plugin might help integrate Nuxt's build/types with Vitest
    // Temporarily commenting out NuxtVitest as it's a separate dep and might need specific setup.
    // The @nuxt/test-utils should ideally handle this.
  ],
  test: {
    // environment: 'nuxt', // Let per-file setup handle Nuxt environment
    globals: true, // To use describe, it, expect globally without imports for convenience in tests
    deps: {
      // Ensure Nuxt and Vue are processed correctly by Vite during tests
      // inline: [/nuxt\/app/, /@vue\//],
    },
    // setupFiles: ['./test/setup/global.ts'], // Removed global setup file
  },
})
