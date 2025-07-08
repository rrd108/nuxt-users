import { createStorage, type Storage } from 'unstorage'
import { createDB, type DB } from 'db0'
import fsDriver from 'unstorage/drivers/fs'
import memoryDriver from 'unstorage/drivers/memory' // Import memory driver
import { join } from 'pathe'
import { tmpdir } from 'node:os'
import { useRuntimeConfig } from '#imports' // To access runtime config for db selection

// Ensure types are imported for the table definitions
import type { User, PersonalAccessToken } from '../../types.d'

let dbInstance: DB | null = null
let usersTableInstance: ReturnType<DB['table']> | null = null
let personalAccessTokensTableInstance: ReturnType<DB['table']> | null = null


function initializeDb() {
  if (dbInstance) return;

  const config = useRuntimeConfig()
  const testMode = config.nuxtUsers?.dbTestMode || process.env.NUXT_USERS_DB_TEST_MODE === 'true';

  let storage: Storage;
  if (testMode) {
    console.log('[Nuxt Users DB] Using in-memory storage for testing.');
    storage = createStorage({ driver: memoryDriver() });
  } else {
    const dbPath = config.nuxtUsers?.dbPath || join(tmpdir(), '.data/nuxt-users');
    console.log(`[Nuxt Users DB] Using fs storage at: ${dbPath}`);
    storage = createStorage({
      driver: fsDriver({
        base: dbPath,
      }),
    });
  }
  dbInstance = createDB(storage);
  usersTableInstance = dbInstance.table<User>('users');
  personalAccessTokensTableInstance = dbInstance.table<PersonalAccessToken>('personal_access_tokens');
}

// Lazy initialize and export
export const getDb = (): DB => {
  if (!dbInstance) initializeDb();
  return dbInstance!;
}

export const usersTable = {
  get: () => {
    if (!usersTableInstance) initializeDb();
    return usersTableInstance!;
  }
};

export const personalAccessTokensTable = {
  get: () => {
    if (!personalAccessTokensTableInstance) initializeDb();
    return personalAccessTokensTableInstance!;
  }
};


// Re-export types for convenience
export type { User, PersonalAccessToken } from '../../types.d'
