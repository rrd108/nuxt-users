import { describe, it, expect } from 'vitest'
import * as utils from '../../src/utils/index'
import * as internal from '../../src/runtime/server/internal/index'

// Guards the public runtime API surface. If this fails, a public export was
// added, removed or renamed. If that is intentional, update the snapshot
// (`vitest -u`) and treat removals/renames as breaking changes in the release.
describe('public API surface', () => {
  it('nuxt-users/utils exports', () => {
    expect(Object.keys(utils).sort()).toMatchInlineSnapshot(`
      [
        "MAX_ROLE_LENGTH",
        "assertValidRole",
        "deepMerge",
        "defaultDisplayFields",
        "defaultFieldLabels",
        "defaultLocaleMessages",
        "en",
        "getAvailableRoles",
        "getNestedValue",
        "getPasswordStrengthColor",
        "getPasswordStrengthText",
        "getPasswordValidationOptions",
        "getTranslation",
        "hu",
        "huFormal",
        "isValidRole",
        "validatePassword",
      ]
    `)
  })

  it('nuxt-users server exports', () => {
    expect(Object.keys(internal).sort()).toMatchInlineSnapshot(`
      [
        "checkTableExists",
        "cleanupPersonalAccessTokens",
        "createMigrationsTable",
        "createPasswordResetTokensTable",
        "createPersonalAccessTokensTable",
        "createUser",
        "createUsersTable",
        "deleteExpiredPersonalAccessTokens",
        "deleteTokensWithoutExpiration",
        "deleteUser",
        "findUserByEmail",
        "findUserById",
        "getAppliedMigrations",
        "getCurrentUserFromToken",
        "getLastLoginTime",
        "getLastLoginTimes",
        "hasAnyUsers",
        "revokeUserTokens",
        "runMigrations",
        "updateUser",
        "updateUserPassword",
        "useDb",
        "useNuxtUsersDatabase",
        "useServerAuth",
      ]
    `)
  })
})
