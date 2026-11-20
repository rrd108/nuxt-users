import { useDb } from './db'
import type { ModuleOptions } from 'nuxt-users/utils'

export const createPasskeyTables = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const db = await useDb(options)

  const passkeysTable = options.tables.passkeys
  const challengesTable = options.tables.passkeyChallenges

  console.log(`[Nuxt Users] DB:Create Passkey Tables ${connectorName} Creating ${passkeysTable} and ${challengesTable} tables...`)

  if (connectorName === 'sqlite') {
    await db.sql`
      CREATE TABLE IF NOT EXISTS {${passkeysTable}} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        credential_id TEXT NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        counter BIGINT NOT NULL DEFAULT 0,
        transports TEXT,
        device_type TEXT NOT NULL,
        backed_up INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL,
        user_handle TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME
      )
    `
    await db.sql`
      CREATE TABLE IF NOT EXISTS {${challengesTable}} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenge TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        user_id INTEGER,
        expires_at BIGINT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
  }
  if (connectorName === 'mysql') {
    await db.sql`
      CREATE TABLE IF NOT EXISTS {${passkeysTable}} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        credential_id VARCHAR(512) NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        counter BIGINT NOT NULL DEFAULT 0,
        transports VARCHAR(255),
        device_type VARCHAR(32) NOT NULL,
        backed_up TINYINT(1) NOT NULL DEFAULT 0,
        name VARCHAR(255) NOT NULL,
        user_handle VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME NULL
      )
    `
    await db.sql`
      CREATE TABLE IF NOT EXISTS {${challengesTable}} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        challenge VARCHAR(512) NOT NULL UNIQUE,
        type VARCHAR(32) NOT NULL,
        user_id INT NULL,
        expires_at BIGINT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
  }
  if (connectorName === 'postgresql') {
    await db.sql`
      CREATE TABLE IF NOT EXISTS {${passkeysTable}} (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        credential_id VARCHAR(512) NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        counter BIGINT NOT NULL DEFAULT 0,
        transports VARCHAR(255),
        device_type VARCHAR(32) NOT NULL,
        backed_up BOOLEAN NOT NULL DEFAULT FALSE,
        name VARCHAR(255) NOT NULL,
        user_handle VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMPTZ
      )
    `
    await db.sql`
      CREATE TABLE IF NOT EXISTS {${challengesTable}} (
        id SERIAL PRIMARY KEY,
        challenge VARCHAR(512) NOT NULL UNIQUE,
        type VARCHAR(32) NOT NULL,
        user_id INTEGER,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `
  }

  await db.sql`CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON {${passkeysTable}} (user_id)`
  await db.sql`CREATE INDEX IF NOT EXISTS idx_passkey_challenges_expires_at ON {${challengesTable}} (expires_at)`

  console.log(`[Nuxt Users] DB:Create Passkey Tables ${connectorName} ✅`)
}
