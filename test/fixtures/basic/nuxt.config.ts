import { getTestOptions } from '../../test-setup'
import NuxtUsers from '../../../src/module'
import type { DatabaseConfig, DatabaseType } from '../../../src/types'

const dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
let dbConfig = {} as DatabaseConfig

if (dbType === 'sqlite') {
  dbConfig = {
    path: './_basic-test',
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
const options = getTestOptions(dbType, dbConfig)

export default defineNuxtConfig({
  modules: [NuxtUsers],
  nuxtUsers: options,
})
