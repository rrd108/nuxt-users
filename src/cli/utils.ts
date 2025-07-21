import type { ModuleOptions, DatabaseConfig } from '../types'
import { loadNuxt } from '@nuxt/kit'

export const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/users.sqlite3',
    },
  },
  tables: {
    migrations: 'migrations',
    users: 'users',
    personalAccessTokens: 'personal_access_tokens',
    passwordResetTokens: 'password_reset_tokens',
  },
  mailer: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'user@ethereal.email',
      pass: 'password',
    },
    defaults: {
      from: '"Nuxt Users Module" <noreply@example.com>',
    },
  },
  passwordResetBaseUrl: 'http://localhost:3000',
}

export const getOptionsFromEnv = (): ModuleOptions => {
  const connectorName = process.env.DB_CONNECTOR || 'sqlite'

  let connectorOptions: DatabaseConfig

  switch (connectorName) {
    case 'sqlite':
      connectorOptions = {
        path: process.env.DB_PATH || './data/default.sqlite3',
      }
      break
    case 'mysql':
      connectorOptions = {
        host: process.env.DB_HOST || 'localhost',
        port: Number.parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nuxt_users',
      }
      break
    case 'postgresql':
      connectorOptions = {
        host: process.env.DB_HOST || 'localhost',
        port: Number.parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nuxt_users',
      }
      break
    default:
      throw new Error(`Unsupported database connector: ${connectorName}`)
  }

  return {
    ...defaultOptions,
    connector: {
      name: connectorName as 'sqlite' | 'mysql' | 'postgresql',
      options: connectorOptions,
    },
  }
}
