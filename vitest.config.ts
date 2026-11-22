import { configDefaults, defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    fileParallelism: false, // This will make all test files run sequentially
    setupFiles: ['./test/vitest.setup.ts'],
    // Agent worktrees under .claude/ hold full copies of the repo, including its tests
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
  resolve: {
    alias: {
      'nuxt-users/utils': resolve(__dirname, './src/utils'),
    },
  },
})
