import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { ModuleOptions, User } from '../../src/types'
import { defaultOptions } from '../../src/module'
import { useDb } from '../../src/runtime/server/utils/db'
import bcrypt from 'bcrypt'

// Mock Google APIs
vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        generateAuthUrl: vi.fn(),
        getToken: vi.fn(),
        setCredentials: vi.fn()
      }))
    },
    oauth2: vi.fn()
  }
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
  let testOptions: ModuleOptions
  let db: Awaited<ReturnType<typeof useDb>>

  beforeEach(async () => {
    vi.clearAllMocks()

    testOptions = {
      ...defaultOptions,
      connector: {
        name: 'sqlite',
        options: {
          path: ':memory:'
        }
      }
    }

    // Initialize database
    db = await useDb(testOptions)

    // Create users table
    await db.sql`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        google_id TEXT UNIQUE,
        profile_picture TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
  })

  afterEach(async () => {
    // Clean up database
    await db.sql`DROP TABLE IF EXISTS users`
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

      const url = getGoogleAuthUrl(mockClient as any, googleOptions)

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

      getGoogleAuthUrl(mockClient as any, googleOptions)

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
      expect(dbUser.rows[0].google_id).toBe('google-123')
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

