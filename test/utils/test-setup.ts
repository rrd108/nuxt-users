import { createDatabase } from 'db0'
import type { Database } from 'db0'
import type { DatabaseConfig, DatabaseType } from '../../src/types'
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
  if (dbType === 'postgres') {
    const postgres = await import('db0/connectors/pg')
    db = createDatabase(postgres.default(testOptions.connector!.options))
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
    // Clean up MySQL and PostgreSQL data
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
  else if (dbType === 'postgres') {
    return {
      connectionString: `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || '123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'test_db'}`
    }
  }
  else {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'test_db'
    }
  }
}
