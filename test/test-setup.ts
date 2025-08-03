import { createDatabase } from 'db0'
import type { Database } from 'db0'
import type { DatabaseConfig, DatabaseType } from '../src/types'
import fs from 'node:fs'

export interface TestSetupOptions {
  dbType: DatabaseType
  dbConfig: DatabaseConfig
  tableName?: string
  cleanupFiles?: string[]
}

export const createTestSetup = async (options: TestSetupOptions) => {
  const { dbType, dbConfig } = options
  let db: Database | undefined

  const testOptions = getTestOptions(dbType, dbConfig)

  // Create database connection
  if (dbType === 'mysql') {
    const mysql = await import('db0/connectors/mysql2')
    db = createDatabase(mysql.default(testOptions.connector!.options))
  }
  if (dbType === 'sqlite') {
    const sqlite = await import('db0/connectors/better-sqlite3')
    db = createDatabase(sqlite.default(testOptions.connector!.options))
  }
  if (dbType === 'postgresql') {
    const postgresql = await import('db0/connectors/postgresql')
    db = createDatabase(postgresql.default(testOptions.connector!.options))
  }
  // should throw on error
  if (!db) {
    throw new Error('Failed to create database connection')
  }

  return { db, testOptions }
}

export const getTestOptions = (dbType: DatabaseType, dbConfig: DatabaseConfig) => ({
  connector: {
    name: dbType,
    options: dbConfig
  },
  tables: {
    migrations: 'migrations',
    users: 'users',
    personalAccessTokens: 'personal_access_tokens',
    passwordResetTokens: 'password_reset_tokens'
  },
  mailer: {
    host: process.env.MAILER_HOST || 'localhost',
    port: Number.parseInt(process.env.MAILER_PORT || '1025'),
    secure: false,
    auth: {
      user: process.env.MAILER_USER || 'test',
      pass: process.env.MAILER_PASSWORD || 'test'
    }
  },
  auth: {
    whitelist: [],
    tokenExpiration: 1440,
    permissions: {}
  },
  passwordValidation: {
    minLength: 0,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
    preventCommonPasswords: false,
  }
})

export const cleanupTestSetup = async (dbType: DatabaseType, db: Database, cleanupFiles: string[], tableName: string) => {
  if (dbType === 'sqlite') {
    // Clean up SQLite files
    for (const file of cleanupFiles) {
      try {
        fs.unlinkSync(file)
      }
      catch {
        // Ignore errors during cleanup
      }
    }
  }
  else {
    // Clean up MySQL data
    if (db) {
      try {
        await db.sql`DROP TABLE IF EXISTS {${tableName}}`
      }
      catch {
        // Ignore errors during cleanup
      }
    }
  }
}

export const getDatabaseConfig = (dbType: DatabaseType): DatabaseConfig => {
  if (dbType === 'sqlite') {
    return {
      path: './_test-db'
    }
  }
  if (dbType === 'mysql') {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'test_db'
    }
  }
  if (dbType === 'postgresql') {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'test_db'
    }
  }
  throw new Error(`Unsupported database type: ${dbType}`)
}
