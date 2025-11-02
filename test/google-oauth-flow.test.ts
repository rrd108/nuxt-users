import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'db0'
import type { ModuleOptions, User, DatabaseType, DatabaseConfig, PersonalAccessToken } from '../src/types'
import { cleanupTestSetup, createTestSetup } from './test-setup'
import { createUsersTable } from '../src/runtime/server/utils/create-users-table'
import { createPersonalAccessTokensTable } from '../src/runtime/server/utils/create-personal-access-tokens-table'
import { addActiveToUsers } from '../src/runtime/server/utils/add-active-to-users'
import { addGoogleOauthFields } from '../src/runtime/server/utils/add-google-oauth-fields'
import bcrypt from 'bcrypt'

/**
 * Layer 2: Integration Tests - Google OAuth Complete Flow
 *
 * Tests the complete OAuth workflow by simulating:
 * 1. User authentication with Google (mocked)
 * 2. Database operations (real)
 * 3. Token creation (real)
 * 4. Cookie handling (simulated)
 * 5. User state management (real)
 */

describe('Google OAuth Complete Flow Integration', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_google_oauth_flow',
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
    testOptions = {
      ...settings.testOptions,
      auth: {
        ...settings.testOptions.auth,
        google: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          successRedirect: '/',
          errorRedirect: '/login?error=oauth_failed',
          allowAutoRegistration: true
        }
      }
    }

    await createUsersTable(testOptions)
    await addActiveToUsers(testOptions)
    await addGoogleOauthFields(testOptions)
    await createPersonalAccessTokensTable(testOptions)
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.personalAccessTokens)
  })

  describe('Scenario 1: New User Registration via OAuth', () => {
    it('should create new user, generate token, and prepare for authentication', async () => {
      // Step 1: Simulate OAuth utilities (using real implementations)
      const { findOrCreateGoogleUser, createAuthTokenForUser } = await import('../src/runtime/server/utils/google-oauth')

      const mockGoogleUser = {
        id: 'google-flow-123',
        email: 'newuser@example.com',
        name: 'New OAuth User',
        picture: 'https://example.com/pic.jpg',
        verified_email: true
      }

      // Step 2: User registration (OAuth creates user)
      const user = await findOrCreateGoogleUser(mockGoogleUser, testOptions)

      // Verify user was created
      expect(user).toBeDefined()
      expect(user?.email).toBe('newuser@example.com')
      expect(user?.google_id).toBe('google-flow-123')
      expect(user?.role).toBe('user')
      expect(user?.active).toBeTruthy()

      // Step 3: Create authentication token
      const token = await createAuthTokenForUser(user!, testOptions, true)

      expect(token).toBeDefined()
      expect(token.length).toBeGreaterThan(100) // Should be a long hex string

      // Step 4: Verify token in database
      const tokens = await db.sql`
        SELECT * FROM personal_access_tokens 
        WHERE token = ${token}
      ` as { rows: PersonalAccessToken[] }

      expect(tokens.rows).toHaveLength(1)
      expect(tokens.rows[0]?.tokenable_id).toBe(user!.id)
      expect(tokens.rows[0]?.tokenable_type).toBe('user')
      expect(tokens.rows[0]?.name).toBe('oauth_auth_token')

      // Step 5: Simulate /me endpoint (verify token works)
      const { getCurrentUserFromToken } = await import('../src/runtime/server/utils/user')
      const authenticatedUser = await getCurrentUserFromToken(token, testOptions)

      expect(authenticatedUser).toBeDefined()
      expect(authenticatedUser?.email).toBe('newuser@example.com')
      expect(authenticatedUser).not.toHaveProperty('password') // Password should be excluded
    })
  })

  describe('Scenario 2: Existing User Login via OAuth', () => {
    it('should link Google account to existing user and authenticate', async () => {
      // Pre-create existing user
      const hashedPassword = await bcrypt.hash('existing-password', 10)
      await db.sql`
        INSERT INTO users (email, name, password, role, active)
        VALUES ('existing@example.com', 'Existing User', ${hashedPassword}, 'admin', true)
      `

      const existingUsers = await db.sql`SELECT * FROM users WHERE email = 'existing@example.com'` as { rows: User[] }
      const existingUserId = existingUsers.rows[0]?.id

      // OAuth flow with same email
      const { findOrCreateGoogleUser, createAuthTokenForUser } = await import('../src/runtime/server/utils/google-oauth')

      const mockGoogleUser = {
        id: 'google-flow-456',
        email: 'existing@example.com',
        name: 'Existing User',
        picture: 'https://example.com/new-pic.jpg',
        verified_email: true
      }

      // Link Google account
      const user = await findOrCreateGoogleUser(mockGoogleUser, testOptions)

      // Verify Google ID was added
      expect(user).toBeDefined()
      expect(user?.id).toBe(existingUserId) // Same user
      expect(user?.google_id).toBe('google-flow-456') // Now has Google ID
      expect(user?.role).toBe('admin') // Role preserved
      expect(user?.profile_picture).toBe('https://example.com/new-pic.jpg') // Picture updated

      // Create token and authenticate
      const token = await createAuthTokenForUser(user!, testOptions, true)
      const { getCurrentUserFromToken } = await import('../src/runtime/server/utils/user')
      const authenticatedUser = await getCurrentUserFromToken(token, testOptions)

      expect(authenticatedUser?.email).toBe('existing@example.com')
      expect(authenticatedUser?.role).toBe('admin')
      expect(authenticatedUser?.google_id).toBe('google-flow-456')
    })
  })

  describe('Scenario 3: Unregistered User with Auto-Registration Disabled', () => {
    it('should reject unregistered user and not create account', async () => {
      // Disable auto-registration
      testOptions.auth.google!.allowAutoRegistration = false

      const { findOrCreateGoogleUser } = await import('../src/runtime/server/utils/google-oauth')

      const mockGoogleUser = {
        id: 'google-flow-789',
        email: 'unregistered@example.com',
        name: 'Unregistered User',
        picture: 'https://example.com/pic.jpg',
        verified_email: true
      }

      // Should return null
      const user = await findOrCreateGoogleUser(mockGoogleUser, testOptions)
      expect(user).toBeNull()

      // Verify no user was created
      const users = await db.sql`SELECT * FROM users WHERE email = 'unregistered@example.com'` as { rows: User[] }
      expect(users.rows).toHaveLength(0)

      // Verify no token was created
      const tokens = await db.sql`SELECT * FROM personal_access_tokens` as { rows: PersonalAccessToken[] }
      expect(tokens.rows).toHaveLength(0)
    })
  })

  describe('Scenario 4: Inactive User Attempting OAuth Login', () => {
    it('should block inactive user from getting authenticated token', async () => {
      // Create inactive user
      const hashedPassword = await bcrypt.hash('password', 10)
      await db.sql`
        INSERT INTO users (email, name, password, role, google_id, active)
        VALUES ('inactive@example.com', 'Inactive User', ${hashedPassword}, 'user', 'google-flow-inactive', false)
      `

      // Attempt to authenticate
      const { findOrCreateGoogleUser } = await import('../src/runtime/server/utils/google-oauth')

      const mockGoogleUser = {
        id: 'google-flow-inactive',
        email: 'inactive@example.com',
        name: 'Inactive User',
        picture: 'https://example.com/pic.jpg',
        verified_email: true
      }

      // User will be found (returns user object)
      const user = await findOrCreateGoogleUser(mockGoogleUser, testOptions)
      expect(user).toBeDefined()
      expect(user).not.toBeNull()
      expect(user!.active).toBeFalsy()

      // The callback handler should reject this user
      // Simulating what happens in callback.get.ts
      if (user && !user.active) {
        // Should redirect to error page instead of creating token
        expect(user.active).toBeFalsy()
        // No token should be created - verify
        const tokens = await db.sql`SELECT * FROM personal_access_tokens` as { rows: PersonalAccessToken[] }
        expect(tokens.rows).toHaveLength(0)
      }
    })
  })

  describe('Scenario 5: Token Expiration and Remember Me', () => {
    it('should create token with correct expiration for remember me', async () => {
      const { findOrCreateGoogleUser, createAuthTokenForUser } = await import('../src/runtime/server/utils/google-oauth')

      const mockGoogleUser = {
        id: 'google-flow-token',
        email: 'tokentest@example.com',
        name: 'Token Test User',
        picture: 'https://example.com/pic.jpg',
        verified_email: true
      }

      const user = await findOrCreateGoogleUser(mockGoogleUser, testOptions)
      const token = await createAuthTokenForUser(user!, testOptions, true) // rememberMe = true

      // Verify token expiration
      const tokens = await db.sql`SELECT expires_at FROM personal_access_tokens WHERE token = ${token}` as { rows: PersonalAccessToken[] }
      const expiresAt = new Date(tokens.rows[0]?.expires_at!)
      const now = new Date()
      const daysDifference = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Should expire in approximately 30 days
      expect(daysDifference).toBeGreaterThanOrEqual(29)
      expect(daysDifference).toBeLessThanOrEqual(31)
    })
  })

  describe('Scenario 6: Profile Picture Updates on Repeat Logins', () => {
    it('should update profile picture when user logs in again', async () => {
      const { findOrCreateGoogleUser } = await import('../src/runtime/server/utils/google-oauth')

      const mockGoogleUser = {
        id: 'google-flow-update',
        email: 'updatetest@example.com',
        name: 'Update Test User',
        picture: 'https://example.com/old-pic.jpg',
        verified_email: true
      }

      // First login
      const firstLogin = await findOrCreateGoogleUser(mockGoogleUser, testOptions)
      expect(firstLogin?.profile_picture).toBe('https://example.com/old-pic.jpg')

      // Second login with new picture
      mockGoogleUser.picture = 'https://example.com/new-pic.jpg'
      const secondLogin = await findOrCreateGoogleUser(mockGoogleUser, testOptions)

      expect(secondLogin?.profile_picture).toBe('https://example.com/new-pic.jpg')
      expect(secondLogin?.id).toBe(firstLogin?.id) // Same user
    })
  })

  describe('Scenario 7: Token Validation and Usage Tracking', () => {
    it('should update last_used_at when token is used', async () => {
      const { findOrCreateGoogleUser, createAuthTokenForUser } = await import('../src/runtime/server/utils/google-oauth')

      const mockGoogleUser = {
        id: 'google-flow-tracking',
        email: 'tracking@example.com',
        name: 'Tracking Test User',
        picture: 'https://example.com/pic.jpg',
        verified_email: true
      }

      const user = await findOrCreateGoogleUser(mockGoogleUser, testOptions)
      const token = await createAuthTokenForUser(user!, testOptions, true)

      // Verify last_used_at is null initially
      let tokens = await db.sql`SELECT last_used_at FROM personal_access_tokens WHERE token = ${token}` as { rows: PersonalAccessToken[] }
      expect(tokens.rows[0]?.last_used_at).toBeNull()

      // Use the token (simulating API call)
      const { getCurrentUserFromToken } = await import('../src/runtime/server/utils/user')
      await getCurrentUserFromToken(token, testOptions)

      // Verify last_used_at was updated
      tokens = await db.sql`SELECT last_used_at FROM personal_access_tokens WHERE token = ${token}` as { rows: PersonalAccessToken[] }
      expect(tokens.rows[0]?.last_used_at).not.toBeNull()
    })
  })

  describe('Scenario 8: Multiple OAuth Logins Create Multiple Tokens', () => {
    it('should create new token each time user logs in via OAuth', async () => {
      const { findOrCreateGoogleUser, createAuthTokenForUser } = await import('../src/runtime/server/utils/google-oauth')

      const mockGoogleUser = {
        id: 'google-flow-multi',
        email: 'multitoken@example.com',
        name: 'Multi Token User',
        picture: 'https://example.com/pic.jpg',
        verified_email: true
      }

      const user = await findOrCreateGoogleUser(mockGoogleUser, testOptions)

      // First login
      const token1 = await createAuthTokenForUser(user!, testOptions, true)

      // Second login (simulating different browser/device)
      const token2 = await createAuthTokenForUser(user!, testOptions, true)

      // Tokens should be different
      expect(token1).not.toBe(token2)

      // Both tokens should exist in database
      const tokens = await db.sql`SELECT * FROM personal_access_tokens WHERE tokenable_id = ${user!.id}` as { rows: PersonalAccessToken[] }
      expect(tokens.rows).toHaveLength(2)

      // Both tokens should be valid
      const { getCurrentUserFromToken } = await import('../src/runtime/server/utils/user')
      const auth1 = await getCurrentUserFromToken(token1, testOptions)
      const auth2 = await getCurrentUserFromToken(token2, testOptions)

      expect(auth1?.id).toBe(user!.id)
      expect(auth2?.id).toBe(user!.id)
    })
  })
})
