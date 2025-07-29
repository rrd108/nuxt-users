import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    AutoImport({
      imports: [
        'vue',
        {
          '#app': [
            'useRuntimeConfig',
            'defineNuxtRouteMiddleware',
            'navigateTo',
            'useState',
            'defineNuxtPlugin',
          ],
        },
        {
          '#imports': [
            'useAuth',
          ]
        }
      ],
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false, // This will make all test files run sequentially
  },
})
