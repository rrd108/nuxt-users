import { fileURLToPath } from 'node:url'

export const EXTERNALS = [
  'db0',
  'db0/connectors/better-sqlite3',
  'db0/connectors/mysql2',
  'db0/connectors/postgresql',
  'better-sqlite3',
  'mysql2',
  'pg'
]

export const BASE_CONFIG = {
  alias: {
    'nuxt-users/utils': fileURLToPath(new URL('./utils/index.ts', import.meta.url))
  },
  vite: {
    build: {
      rollupOptions: {
        external: EXTERNALS
      }
    },
    optimizeDeps: {
      exclude: ['db0', 'better-sqlite3', 'mysql2', 'pg', 'bcrypt']
    }
  },
}
