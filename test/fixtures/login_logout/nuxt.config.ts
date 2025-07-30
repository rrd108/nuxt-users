import { getTestOptions } from '../../test-setup'
import NuxtUsers from '../../../src/module'
import type { DatabaseConfig, DatabaseType } from '../../../src/types'
import { BASE_CONFIG } from '../../../src/constants'

const dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
let dbConfig = {} as DatabaseConfig

if (dbType === 'sqlite') {
  dbConfig = {
    path: './_login_logout-test',
  }
}
if (dbType === 'mysql') {
  dbConfig = {
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
}
if (dbType === 'postgresql') {
  dbConfig = {
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
}
const options = getTestOptions(dbType, dbConfig)

export default defineNuxtConfig({
  modules: [NuxtUsers],
  ...BASE_CONFIG,
  nuxtUsers: options,
})
