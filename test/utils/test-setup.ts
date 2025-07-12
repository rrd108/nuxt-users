import { createDatabase } from 'db0'
import type { Database } from 'db0'
import type { DatabaseConfig, DatabaseType, ModuleOptions } from '../../src/types'
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
        await db.sql`DROP TABLE IF EXISTS users`
        await db.sql`DROP TABLE IF EXISTS password_reset_tokens`
        await db.sql`DROP TABLE IF EXISTS personal_access_tokens`
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
