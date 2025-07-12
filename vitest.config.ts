import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false, // This will make all test files run sequentially
  },
})
