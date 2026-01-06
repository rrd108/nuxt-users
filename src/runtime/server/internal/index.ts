// Internal exports for CLI access
export {
  useDb,
  checkTableExists,
  createUser,
  findUserByEmail,
  updateUserPassword,
  getCurrentUserFromToken,
  hasAnyUsers,
  deleteExpiredPersonalAccessTokens,
  deleteTokensWithoutExpiration,
  cleanupPersonalAccessTokens,
  revokeUserTokens,
  getLastLoginTime,
  findUserById,
  updateUser,
  deleteUser,
  createUsersTable,
  createPersonalAccessTokensTable,
  createPasswordResetTokensTable,
  createMigrationsTable,
  runMigrations,
  getAppliedMigrations
} from '../utils'
export { useNuxtUsersDatabase } from '../composables/useNuxtUsersDatabase'
export { useServerAuth } from '../composables/useServerAuth'
