#!/usr/bin/env node

/**
 * Script to create an empty SQLite database file for distribution
 * This ensures users have a working database file out of the box
 */

import { createDatabase } from 'db0'
import sqlite from 'db0/connectors/better-sqlite3'
import { promises as fs } from 'node:fs'
import { dirname } from 'node:path'

const DB_PATH = './data/default.sqlite3'

async function createEmptyDatabase() {
  try {
    // Ensure data directory exists
    const dbDir = dirname(DB_PATH)
    await fs.mkdir(dbDir, { recursive: true })

    console.log(`Creating empty SQLite database at: ${DB_PATH}`)

    // Create database connection (this will create the file)
    const db = createDatabase(sqlite({ path: DB_PATH }))

    // Test the connection with a simple query
    await db.sql`SELECT 1 as test`

    console.log('✅ Empty SQLite database created successfully')

    // Close the connection (if available)
    if (typeof db.close === 'function') {
      await db.close()
    }
  }
  catch (error) {
    console.error('❌ Failed to create empty SQLite database:', error)
    process.exit(1)
  }
}

// Run the script
createEmptyDatabase()
