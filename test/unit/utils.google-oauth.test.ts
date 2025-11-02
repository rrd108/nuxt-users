import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Database } from 'db0'
import type { ModuleOptions, User, DatabaseType, DatabaseConfig } from '../../src/types'
import type { OAuth2Client } from 'google-auth-library'
import { cleanupTestSetup, createTestSetup } from '../test-setup'
import { createUsersTable } from '../../src/runtime/server/utils/create-users-table'
import { addActiveToUsers } from '../../src/runtime/server/utils/add-active-to-users'
import { addGoogleOauthFields } from '../../src/runtime/server/utils/add-google-oauth-fields'
import bcrypt from 'bcrypt'

// Mock Google Auth Library
vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn(function(this: any) {
    this.generateAuthUrl = vi.fn()
    this.getToken = vi.fn()
    this.setCredentials = vi.fn()
  })
}))

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn()
  }
}))

// Import after mocks
const {
  createGoogleOAuth2Client,
  getGoogleAuthUrl,
  generateSecurePassword,
  findOrCreateGoogleUser
} = await import('../../src/runtime/server/utils/google-oauth')

describe('Google OAuth Utilities', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    vi.clearAllMocks()

    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    if (dbType === 'sqlite') {
      dbConfig = {
        path: './_google_oauth_utils',
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
    await addGoogleOauthFields(testOptions)
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
    vi.clearAllMocks()
  })

  describe('createGoogleOAuth2Client', () => {
    it('should create OAuth2 client with correct credentials', () => {
      const googleOptions = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      }
      const callbackUrl = 'http://localhost:3000/callback'

      const client = createGoogleOAuth2Client(googleOptions, callbackUrl)

      expect(client).toBeDefined()
    })
  })

  describe('getGoogleAuthUrl', () => {
    it('should generate auth URL with default scopes', () => {
      const mockClient = {
        generateAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?...')
      }
      const googleOptions = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      }

      const url = getGoogleAuthUrl(mockClient as unknown as OAuth2Client, googleOptions)

      expect(mockClient.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: ['openid', 'profile', 'email'],
        include_granted_scopes: true
      })
      expect(url).toBe('https://accounts.google.com/o/oauth2/v2/auth?...')
    })

    it('should use custom scopes when provided', () => {
      const mockClient = {
        generateAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?...')
      }
      const googleOptions = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        scopes: ['openid', 'email']
      }

      getGoogleAuthUrl(mockClient as unknown as OAuth2Client, googleOptions)

      expect(mockClient.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: ['openid', 'email'],
        include_granted_scopes: true
      })
    })
  })

  describe('generateSecurePassword', () => {
    it('should generate a secure hashed password', async () => {
      const mockHash = 'hashed-password-123'
      vi.mocked(bcrypt.hash).mockResolvedValue(mockHash as never)

      const password = await generateSecurePassword()

      expect(bcrypt.hash).toHaveBeenCalled()
      expect(password).toBe(mockHash)
    })
  })

  describe('findOrCreateGoogleUser', () => {
    const mockGoogleUser = {
      id: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/pic.jpg',
      verified_email: true
    }

    beforeEach(() => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never)
    })

    it('should return existing user with matching google_id', async () => {
      // Create user with google_id
      await db.sql`
        INSERT INTO users (email, name, password, role, google_id, profile_picture, active)
        VALUES ('test@example.com', 'Existing User', 'old-password', 'user', 'google-123', 'old-pic.jpg', true)
      `

      const user = await findOrCreateGoogleUser(mockGoogleUser, testOptions)

      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
      expect(user?.google_id).toBe('google-123')
    })

    it('should update profile picture for existing user', async () => {
      // Create user with old picture
      await db.sql`
        INSERT INTO users (email, name, password, role, google_id, profile_picture, active)
        VALUES ('test@example.com', 'Test User', 'password', 'user', 'google-123', 'old-pic.jpg', true)
      `

      const user = await findOrCreateGoogleUser(mockGoogleUser, testOptions)

      expect(user?.profile_picture).toBe('https://example.com/pic.jpg')
    })

    it('should link google_id to existing user with matching email', async () => {
      // Create user without google_id
      await db.sql`
        INSERT INTO users (email, name, password, role, active)
        VALUES ('test@example.com', 'Existing User', 'password', 'user', true)
      `

      const user = await findOrCreateGoogleUser(mockGoogleUser, testOptions)

      expect(user).toBeDefined()
      expect(user?.google_id).toBe('google-123')
      expect(user?.profile_picture).toBe('https://example.com/pic.jpg')

      // Verify in database
      const dbUser = await db.sql`SELECT google_id FROM users WHERE email = 'test@example.com'` as { rows: User[] }
      expect(dbUser.rows[0]?.google_id).toBe('google-123')
    })

    it('should create new user when allowAutoRegistration is true', async () => {
      const optionsWithAutoReg = {
        ...testOptions,
        auth: {
          ...testOptions.auth,
          google: {
            clientId: 'test',
            clientSecret: 'test',
            allowAutoRegistration: true
          }
        }
      }

      const user = await findOrCreateGoogleUser(mockGoogleUser, optionsWithAutoReg)

      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
      expect(user?.name).toBe('Test User')
      expect(user?.google_id).toBe('google-123')
      expect(user?.profile_picture).toBe('https://example.com/pic.jpg')
      expect(user?.active).toBeTruthy() // SQLite returns 1 for boolean true

      // Verify password was hashed
      expect(bcrypt.hash).toHaveBeenCalled()
    })

    it('should return null when user not found and allowAutoRegistration is false', async () => {
      const optionsWithoutAutoReg = {
        ...testOptions,
        auth: {
          ...testOptions.auth,
          google: {
            clientId: 'test',
            clientSecret: 'test',
            allowAutoRegistration: false
          }
        }
      }

      const user = await findOrCreateGoogleUser(mockGoogleUser, optionsWithoutAutoReg)

      expect(user).toBeNull()

      // Verify no user was created
      const dbUsers = await db.sql`SELECT * FROM users` as { rows: User[] }
      expect(dbUsers.rows).toHaveLength(0)
    })

    it('should return null by default when user not found (allowAutoRegistration defaults to false)', async () => {
      const user = await findOrCreateGoogleUser(mockGoogleUser, testOptions)

      expect(user).toBeNull()
    })

    it('should set user role to "user" for new registrations', async () => {
      const optionsWithAutoReg = {
        ...testOptions,
        auth: {
          ...testOptions.auth,
          google: {
            clientId: 'test',
            clientSecret: 'test',
            allowAutoRegistration: true
          }
        }
      }

      const user = await findOrCreateGoogleUser(mockGoogleUser, optionsWithAutoReg)

      expect(user?.role).toBe('user')
    })

    it('should handle Google user without profile picture', async () => {
      const googleUserNoPic = {
        ...mockGoogleUser,
        picture: undefined
      }

      const optionsWithAutoReg = {
        ...testOptions,
        auth: {
          ...testOptions.auth,
          google: {
            clientId: 'test',
            clientSecret: 'test',
            allowAutoRegistration: true
          }
        }
      }

      const user = await findOrCreateGoogleUser(googleUserNoPic, optionsWithAutoReg)

      expect(user).toBeDefined()
      expect(user?.profile_picture).toBeNull()
    })
  })
})
