import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import type { DatabaseType, DatabaseConfig, ModuleOptions } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './test-setup'
import { createUsersTable } from '../src/runtime/server/utils/create-users-table'
import { createPersonalAccessTokensTable } from '../src/runtime/server/utils/create-personal-access-tokens-table'
import { createUser, findUserByEmail, updateUser, updateUserPassword, getLastLoginTime, getCurrentUserFromToken } from '../src/runtime/server/utils/user'
import { addActiveToUsers } from '../src/runtime/server/utils/add-active-to-users'

describe('User Utilities (src/utils/user.ts)', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_utils_user',
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
    if (dbType === 'postgresql') {
      dbConfig = {
        host: process.env.DB_HOST,
        port: Number.parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      }
    }

    const settings = await createTestSetup({
      dbType,
      dbConfig,
    })

    db = settings.db
    testOptions = settings.testOptions

    await createUsersTable(testOptions)
    await addActiveToUsers(testOptions)
    await createPersonalAccessTokensTable(testOptions)
  })

  afterEach(async () => {
    // Clean up tables
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.passwordResetTokens)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.personalAccessTokens)
  })

  describe('createUser', () => {
    it('should hash password and insert user', async () => {
      const userData = { email: 'test@webmania.cc', name: 'Test User', password: 'password123' }

      const user = await createUser(userData, testOptions)

      expect(user).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.name).toBe(userData.name)
      expect(user).not.toHaveProperty('password')
      expect(user.id).toBeDefined()
      expect(user.created_at).toBeDefined()
      expect(user.updated_at).toBeDefined()

      // Verify the password was hashed in the database
      const dbUser = await db.sql`SELECT * FROM {${testOptions.tables.users}} WHERE email = ${userData.email}` as { rows: Array<{ password: string }> }
      expect(dbUser.rows).toHaveLength(1)
      expect(dbUser.rows[0].password).not.toBe(userData.password)
      expect(dbUser.rows[0].password).toMatch(/^\$2[aby]\$\d{1,2}\$/)
    })

    it('should return the created user (without password)', async () => {
      const userData = { email: 'test2@webmania.cc', name: 'Test User 2', password: 'password123' }

      const user = await createUser(userData, testOptions)

      expect(user).toEqual({
        id: expect.any(Number),
        email: userData.email,
        name: userData.name,
        role: 'user',
        created_at: expect.any(String),
        updated_at: expect.any(String),
        active: expect.anything()
      })
      expect(user).not.toHaveProperty('password')
    })

    it('should create user with custom role', async () => {
      const userData = { email: 'admin@webmania.cc', name: 'Admin User', password: 'password123', role: 'admin' }

      const user = await createUser(userData, testOptions)

      expect(user).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.name).toBe(userData.name)
      expect(user.role).toBe('admin')
      expect(user).not.toHaveProperty('password')
    })
  })

  describe('findUserByEmail', () => {
    it('should return user if found', async () => {
      const email = 'test@webmania.cc'
      const userData = { email, name: 'Test User', password: 'password123' }

      // Create a user first
      await createUser(userData, testOptions)

      const user = await findUserByEmail(email, testOptions)

      expect(user).toBeDefined()
      expect(user!.email).toBe(email)
      expect(user!.name).toBe(userData.name)
      expect(user!.password).toMatch(/^\$2[aby]\$\d{1,2}\$/) // bcrypt hash pattern
    })

    it('should return null if user not found', async () => {
      const email = 'notfound@webmania.cc'

      const user = await findUserByEmail(email, testOptions)

      expect(user).toBeNull()
    })
  })

  describe('updateUserPassword', () => {
    it('should hash the new password and update the user', async () => {
      const email = 'test@webmania.cc'
      const userData = { email, name: 'Test User', password: 'oldpassword123' }
      const newPassword = 'newPassword123'

      // Create a user first
      await createUser(userData, testOptions)

      // Get the original password hash
      const originalUser = await db.sql`SELECT password FROM {${testOptions.tables.users}} WHERE email = ${email}` as { rows: Array<{ password: string }> }
      const originalPasswordHash = originalUser.rows[0].password

      await updateUserPassword(email, newPassword, testOptions)

      // Get the updated password hash
      const updatedUser = await db.sql`SELECT password FROM {${testOptions.tables.users}} WHERE email = ${email}` as { rows: Array<{ password: string }> }
      const updatedPasswordHash = updatedUser.rows[0].password

      // Verify the password was changed
      expect(updatedPasswordHash).not.toBe(originalPasswordHash)
      expect(updatedPasswordHash).toMatch(/^\$2[aby]\$\d{1,2}\$/) // bcrypt hash pattern
      expect(updatedPasswordHash).not.toBe(newPassword) // Should be hashed, not plain text
    })
  })

  describe('updateUser', () => {
    it('should update user details in the database', async () => {
      // 1. Create a user
      const userData = { email: 'update@example.com', name: 'Original Name', password: 'password123' }
      const createdUser = await createUser(userData, testOptions)

      // 2. Update the user's name and role
      const updates = { name: 'Updated Name', role: 'admin' }
      await updateUser(createdUser.id, updates, testOptions)

      // 3. Fetch the user directly from the database to verify the update
      const result = await db.sql`SELECT * FROM {${testOptions.tables.users}} WHERE id = ${createdUser.id}`
      const dbUser = result.rows![0]

      // 4. Assert that the details are updated
      expect(dbUser.name).toBe(updates.name)
      expect(dbUser.role).toBe(updates.role)
    })
  })

  describe('Integration tests', () => {
    it('should work together: create user, find user, update password', async () => {
      const userData = { email: 'integration@webmania.cc', name: 'Integration User', password: 'initialpassword' }

      // Step 1: Create user
      const createdUser = await createUser(userData, testOptions)
      expect(createdUser.email).toBe(userData.email)
      expect(createdUser).not.toHaveProperty('password')

      // Step 2: Find user
      const foundUser = await findUserByEmail(userData.email, testOptions)
      expect(foundUser).toBeDefined()
      expect(foundUser!.email).toBe(userData.email)
      expect(foundUser!.password).toMatch(/^\$2[aby]\$\d{1,2}\$/)

      // Step 3: Update password
      const newPassword = 'newsecurepassword'
      await updateUserPassword(userData.email, newPassword, testOptions)

      // Step 4: Verify password was updated
      const updatedUser = await findUserByEmail(userData.email, testOptions)
      expect(updatedUser).toBeDefined()
      expect(updatedUser!.password).not.toBe(foundUser!.password)
      expect(updatedUser!.password).toMatch(/^\$2[aby]\$\d{1,2}\$/)
    })

    it('should handle multiple users correctly', async () => {
      const user1Data = { email: 'user1@webmania.cc', name: 'User 1', password: 'password1' }
      const user2Data = { email: 'user2@webmania.cc', name: 'User 2', password: 'password2' }

      // Create multiple users
      const user1 = await createUser(user1Data, testOptions)
      const user2 = await createUser(user2Data, testOptions)

      expect(user1.email).toBe(user1Data.email)
      expect(user2.email).toBe(user2Data.email)

      // Find both users
      const foundUser1 = await findUserByEmail(user1Data.email, testOptions)
      const foundUser2 = await findUserByEmail(user2Data.email, testOptions)

      expect(foundUser1).toBeDefined()
      expect(foundUser2).toBeDefined()
      expect(foundUser1!.email).toBe(user1Data.email)
      expect(foundUser2!.email).toBe(user2Data.email)

      // Update one user's password
      await updateUserPassword(user1Data.email, 'newpassword1', testOptions)

      // Verify only the updated user's password changed
      const updatedUser1 = await findUserByEmail(user1Data.email, testOptions)
      const unchangedUser2 = await findUserByEmail(user2Data.email, testOptions)

      expect(updatedUser1!.password).not.toBe(foundUser1!.password)
      expect(unchangedUser2!.password).toBe(foundUser2!.password)
    })
  })

  describe('getLastLoginTime', () => {
    it('should return null for user with no login tokens', async () => {
      // Create a user but no tokens
      const userData = { email: 'notoken@webmania.cc', name: 'No Token User', password: 'password123' }
      const user = await createUser(userData, testOptions)

      const lastLogin = await getLastLoginTime(user.id, testOptions)

      expect(lastLogin).toBeNull()
    })

    it('should return last login time from most recent token', async () => {
      // Create a user
      const userData = { email: 'login@webmania.cc', name: 'Login User', password: 'password123' }
      const user = await createUser(userData, testOptions)

      // Create a token (simulating a login)
      const token1Time = '2024-01-01 10:00:00'
      const uniqueToken = `token1_${Date.now()}_${Math.random()}`
      await db.sql`
        INSERT INTO {${testOptions.tables.personalAccessTokens}} 
        (tokenable_type, tokenable_id, name, token, created_at, updated_at)
        VALUES ('user', ${user.id}, 'auth_token', ${uniqueToken}, ${token1Time}, ${token1Time})
      `

      const lastLogin = await getLastLoginTime(user.id, testOptions)

      expect(lastLogin).toBeDefined()
      expect(typeof lastLogin).toBe('string')
      // Should be a valid ISO string or database timestamp
      expect(lastLogin).toMatch(/\d{4}-\d{2}-\d{2}/) // Date format check
    })

    it('should return most recent login from multiple tokens', async () => {
      // Create a user
      const userData = { email: 'multilogin@webmania.cc', name: 'Multi Login User', password: 'password123' }
      const user = await createUser(userData, testOptions)

      // Create multiple tokens with different timestamps
      const olderTime = '2024-01-01 10:00:00'
      const newerTime = '2024-01-02 15:30:00'

      await db.sql`
        INSERT INTO {${testOptions.tables.personalAccessTokens}} 
        (tokenable_type, tokenable_id, name, token, created_at, updated_at)
        VALUES ('user', ${user.id}, 'old_token', ${`token_old_${Date.now()}_1`}, ${olderTime}, ${olderTime})
      `

      await db.sql`
        INSERT INTO {${testOptions.tables.personalAccessTokens}} 
        (tokenable_type, tokenable_id, name, token, created_at, updated_at)
        VALUES ('user', ${user.id}, 'new_token', ${`token_new_${Date.now()}_2`}, ${newerTime}, ${newerTime})
      `

      const lastLogin = await getLastLoginTime(user.id, testOptions)

      expect(lastLogin).toBeDefined()
      expect(typeof lastLogin).toBe('string')

      // Should be the newer time (exact comparison depends on database format)
      // We'll check that it contains the newer date
      expect(lastLogin).toMatch(/2024-01-02/) // Should contain the newer date
    })

    it('should only return tokens for the specified user', async () => {
      // Create two users
      const user1Data = { email: 'user1@webmania.cc', name: 'User 1', password: 'password123' }
      const user2Data = { email: 'user2@webmania.cc', name: 'User 2', password: 'password123' }

      const user1 = await createUser(user1Data, testOptions)
      const user2 = await createUser(user2Data, testOptions)

      // Create tokens for both users
      const user1Time = '2024-01-01 10:00:00'
      const user2Time = '2024-01-02 15:30:00' // Later time

      await db.sql`
        INSERT INTO {${testOptions.tables.personalAccessTokens}} 
        (tokenable_type, tokenable_id, name, token, created_at, updated_at)
        VALUES ('user', ${user1.id}, 'user1_token', 'token1_unique', ${user1Time}, ${user1Time})
      `

      await db.sql`
        INSERT INTO {${testOptions.tables.personalAccessTokens}} 
        (tokenable_type, tokenable_id, name, token, created_at, updated_at)
        VALUES ('user', ${user2.id}, 'user2_token', 'token2_unique', ${user2Time}, ${user2Time})
      `

      // Get last login for user1 - should only return user1's token time
      const user1LastLogin = await getLastLoginTime(user1.id, testOptions)
      const user2LastLogin = await getLastLoginTime(user2.id, testOptions)

      expect(user1LastLogin).toBeDefined()
      expect(user2LastLogin).toBeDefined()

      // Each should contain their respective dates
      expect(user1LastLogin).toMatch(/2024-01-01/)
      expect(user2LastLogin).toMatch(/2024-01-02/)
    })

    it('should only consider tokens with tokenable_type "user"', async () => {
      // Create a user
      const userData = { email: 'typetest@webmania.cc', name: 'Type Test User', password: 'password123' }
      const user = await createUser(userData, testOptions)

      // Create tokens with different tokenable_types
      const userTokenTime = '2024-01-01 10:00:00'
      const adminTokenTime = '2024-01-02 15:30:00' // Later but different type

      await db.sql`
        INSERT INTO {${testOptions.tables.personalAccessTokens}} 
        (tokenable_type, tokenable_id, name, token, created_at, updated_at)
        VALUES ('user', ${user.id}, 'user_token', 'user_token_unique', ${userTokenTime}, ${userTokenTime})
      `

      await db.sql`
        INSERT INTO {${testOptions.tables.personalAccessTokens}} 
        (tokenable_type, tokenable_id, name, token, created_at, updated_at)
        VALUES ('admin', ${user.id}, 'admin_token', 'admin_token_unique', ${adminTokenTime}, ${adminTokenTime})
      `

      const lastLogin = await getLastLoginTime(user.id, testOptions)

      expect(lastLogin).toBeDefined()
      // Should only consider the 'user' type token, not the 'admin' type
      expect(lastLogin).toMatch(/2024-01-01/)
    })

    it('should handle database timestamp formats correctly', async () => {
      // Create a user
      const userData = { email: 'timestamp@webmania.cc', name: 'Timestamp User', password: 'password123' }
      const user = await createUser(userData, testOptions)

      // Insert token using CURRENT_TIMESTAMP (real database timestamp)
      await db.sql`
        INSERT INTO {${testOptions.tables.personalAccessTokens}} 
        (tokenable_type, tokenable_id, name, token, created_at, updated_at)
        VALUES ('user', ${user.id}, 'current_token', ${`current_token_${Date.now()}`}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      const lastLogin = await getLastLoginTime(user.id, testOptions)

      expect(lastLogin).toBeDefined()
      expect(typeof lastLogin).toBe('string')

      // Should be a valid date string that can be parsed
      const loginDate = new Date(lastLogin!)
      expect(loginDate.toString()).not.toBe('Invalid Date')

      // Should be a timestamp (positive number when converted to time)
      expect(loginDate.getTime()).toBeGreaterThan(0)

      // Should contain reasonable date format
      expect(lastLogin).toMatch(/\d{4}/) // Should contain a 4-digit year
    })

    it('should return null for non-existent user', async () => {
      // Test with a user ID that doesn't exist
      const nonExistentUserId = 99999

      const lastLogin = await getLastLoginTime(nonExistentUserId, testOptions)

      expect(lastLogin).toBeNull()
    })
  })

  describe('getCurrentUserFromToken', () => {
    it('should get user from valid token without password', async () => {
      // Create a user
      const userData = { email: 'currentuser@webmania.cc', name: 'Current User', password: 'password123' }
      const user = await createUser(userData, testOptions)

      // Create a valid token
      const token = `valid_test_token_${Date.now()}_${Math.random()}`
      await db.sql`
        INSERT INTO {${testOptions.tables.personalAccessTokens}} 
        (tokenable_type, tokenable_id, name, token, created_at, updated_at)
        VALUES ('user', ${user.id}, 'auth_token', ${token}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      const currentUser = await getCurrentUserFromToken(token, testOptions)

      expect(currentUser).toBeDefined()
      expect(currentUser!.id).toBe(user.id)
      expect(currentUser!.email).toBe(userData.email)
      expect(currentUser!.name).toBe(userData.name)
      expect(currentUser!.role).toBe('user')
      expect(currentUser).not.toHaveProperty('password') // Always excludes password for security

      // Verify token was used (last_used_at should be updated)
      const tokenResult = await db.sql`
        SELECT last_used_at FROM {${testOptions.tables.personalAccessTokens}}
        WHERE token = ${token}
      ` as { rows: Array<{ last_used_at: string | null }> }

      expect(tokenResult.rows[0].last_used_at).not.toBeNull()
    })

    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid_token_123'

      const currentUser = await getCurrentUserFromToken(invalidToken, testOptions)

      expect(currentUser).toBeNull()
    })

    it('should return null for expired token', async () => {
      // Create a user
      const userData = { email: 'expired@webmania.cc', name: 'Expired User', password: 'password123' }
      const user = await createUser(userData, testOptions)

      // Create an expired token
      const expiredToken = `expired_token_${Date.now()}_${Math.random()}`
      const pastDate = '2020-01-01 10:00:00' // Well in the past

      await db.sql`
        INSERT INTO {${testOptions.tables.personalAccessTokens}} 
        (tokenable_type, tokenable_id, name, token, expires_at, created_at, updated_at)
        VALUES ('user', ${user.id}, 'expired_token', ${expiredToken}, ${pastDate}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      const currentUser = await getCurrentUserFromToken(expiredToken, testOptions)

      expect(currentUser).toBeNull()
    })
  })
})
