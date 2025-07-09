import NuxtUsers from '../../../src/module'
import { fileURLToPath } from 'node:url'
import { resolve } from 'pathe'

const dbPath = resolve(fileURLToPath(import.meta.url), '../_db.sqlite3')

export default defineNuxtConfig({
  modules: [
    NuxtUsers,
  ],
  nuxtUsers: {
    connector: {
      name: 'sqlite',
      options: {
        path: dbPath,
      },
    },
  },
})
