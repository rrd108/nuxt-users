import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createUser, findUserByEmail, updateUserPassword } from '../src/runtime/server/utils/user'
import { createDatabase } from 'db0'
import bcrypt from 'bcrypt'
import type { ModuleOptions, User } from '../src/types' // Assuming types.ts is correctly structured

// Mock db0 and its methods
vi.mock('db0', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createDatabase: vi.fn(() => ({
      sql: vi.fn(),
      raw: vi.fn(str => str), // Simple mock for db.raw
    })),
  }
})

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: { // Assuming bcrypt is used as default import
    hash: vi.fn(),
    compare: vi.fn(),
  }
}))

// Mock getConnector
vi.mock('../src/runtime/server/utils/db', () => ({
  getConnector: vi.fn().mockResolvedValue(vi.fn()), // Mock getConnector to return a dummy connector function
}))

describe('User Utilities (src/runtime/server/utils/user.ts)', () => {
  let mockDb: any
  const mockOptions: ModuleOptions = {
    connector: { name: 'sqlite', options: { path: ':memory:' } },
    tables: { users: true, personalAccessTokens: true, passwordResetTokens: true },
  }

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Setup new mock instance for db.sql for each test
    const dbInstance = {
      sql: vi.fn(),
      raw: vi.fn(str => str),
    };
    (createDatabase as vi.Mock).mockReturnValue(dbInstance)
    mockDb = dbInstance // Store mockDb for use in tests
  })

  describe('createUser', () => {
    it('should hash password and insert user', async () => {
      const userData = { email: 'test@example.com', name: 'Test User', password: 'password123' }
      const hashedPassword = 'hashedPassword'
      ;(bcrypt.hash as vi.Mock).mockResolvedValue(hashedPassword)
      mockDb.sql.mockResolvedValueOnce({ rows: [] }) // For INSERT
        .mockResolvedValueOnce({ rows: [{ id: 1, ...userData, password: hashedPassword }] }) // For SELECT

      await createUser(userData, mockOptions)

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10)
      expect(mockDb.sql).toHaveBeenCalledWith(
        expect.arrayContaining([
        `
    INSERT INTO users (email, name, password, created_at, updated_at)
    VALUES (`, `, `, `, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `]),
        userData.email,
        userData.name,
        hashedPassword
      )
      expect(mockDb.sql).toHaveBeenCalledWith(
        expect.arrayContaining([`SELECT id, email, name, created_at, updated_at FROM users WHERE email = `]),
        userData.email
      )
    })

    it('should return the created user (without password)', async () => {
      const userData = { email: 'test@example.com', name: 'Test User', password: 'password123' };
      const hashedPassword = 'hashedPassword';
      const expectedUser = { id: 1, email: userData.email, name: userData.name, created_at: expect.any(String), updated_at: expect.any(String) };

      (bcrypt.hash as vi.Mock).mockResolvedValue(hashedPassword);
      // Mock for INSERT
      mockDb.sql.mockResolvedValueOnce({ rows: [] });
      // Mock for SELECT returning the user
      mockDb.sql.mockResolvedValueOnce({ rows: [expectedUser] });

      const user = await createUser(userData, mockOptions);

      expect(user).toEqual(expectedUser);
      expect(user).not.toHaveProperty('password');
    });

    it('should throw an error if user retrieval fails after creation', async () => {
      const userData = { email: 'test@example.com', name: 'Test User', password: 'password123' };
      (bcrypt.hash as vi.Mock).mockResolvedValue('hashedPassword');
      mockDb.sql.mockResolvedValueOnce({ rows: [] }); // INSERT
      mockDb.sql.mockResolvedValueOnce({ rows: [] }); // SELECT fails to find user

      await expect(createUser(userData, mockOptions))
        .rejects.toThrow('Failed to retrieve created user.');
    });
  })

  describe('findUserByEmail', () => {
    it('should return user if found', async () => {
      const email = 'test@example.com'
      const mockUser = { id: 1, email, name: 'Test User', password: 'hashedPassword' }
      mockDb.sql.mockResolvedValue({ rows: [mockUser] })

      const user = await findUserByEmail(email, mockOptions)

      expect(mockDb.sql).toHaveBeenCalledWith(
        expect.arrayContaining([`SELECT * FROM users WHERE email = `]),
        email
      )
      expect(user).toEqual(mockUser)
    })

    it('should return null if user not found', async () => {
      const email = 'notfound@example.com'
      mockDb.sql.mockResolvedValue({ rows: [] })

      const user = await findUserByEmail(email, mockOptions)

      expect(user).toBeNull()
    })
  })

  describe('updateUserPassword', () => {
    it('should hash the new password and update the user', async () => {
      const email = 'test@example.com'
      const newPassword = 'newPassword123'
      const hashedPassword = 'newHashedPassword'
      ;(bcrypt.hash as vi.Mock).mockResolvedValue(hashedPassword)
      mockDb.sql.mockResolvedValue({ rows: [] }) // For UPDATE

      await updateUserPassword(email, newPassword, mockOptions)

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10)
      expect(mockDb.sql).toHaveBeenCalledWith(
        expect.arrayContaining([`
    UPDATE users
    SET password = `, `, updated_at = CURRENT_TIMESTAMP
    WHERE email = `
        ]),
        hashedPassword,
        email
      )
    })
  })
})
