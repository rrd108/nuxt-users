import { useDb } from './db'
import bcrypt from 'bcrypt'
import { validatePassword, getPasswordValidationOptions } from './password-validation'
import type { ModuleOptions, User } from '../types'

interface CreateUserParams {
  email: string
  name: string
  password: string
  role?: string
}

/**
 * Creates a new user in the database.
 * Hashes the password before storing.
 */
export const createUser = async (userData: CreateUserParams, options: ModuleOptions): Promise<Omit<User, 'password'>> => {
  const db = await useDb(options)
  const usersTable = options.tables.users

  // Validate password strength
  const passwordOptions = getPasswordValidationOptions(options)
  const passwordValidation = validatePassword(userData.password, passwordOptions)
  if (!passwordValidation.isValid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`)
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  // Set default role if not provided
  const role = userData.role || 'user'

  // Insert the new user
  await db.sql`
    INSERT INTO {${usersTable}} (email, name, password, role, created_at, updated_at)
    VALUES (${userData.email}, ${userData.name}, ${hashedPassword}, ${role}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `
  // Fetch the created user to return it (especially to get the ID and ensure it was created)
  // Exclude password in the return type
  const result = await db.sql`SELECT id, email, name, role, created_at, updated_at FROM {${usersTable}} WHERE email = ${userData.email}` as { rows: Array<{ id: number, email: string, name: string, role: string, created_at: Date | string, updated_at: Date | string }> }

  if (result.rows.length === 0) {
    throw new Error('Failed to retrieve created user.')
  }

  const user = result.rows[0]

  // Convert Date objects to ISO strings if needed
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    created_at: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
    updated_at: user.updated_at instanceof Date ? user.updated_at.toISOString() : user.updated_at
  }
}

/**
 * Finds a user by their email address.
 */
export const findUserByEmail = async (email: string, options: ModuleOptions): Promise<User | null> => {
  const db = await useDb(options)
  const usersTable = options.tables.users

  const result = await db.sql`SELECT * FROM {${usersTable}} WHERE email = ${email}` as { rows: Array<{ id: number, email: string, name: string, password: string, role: string, created_at: Date | string, updated_at: Date | string }> }

  if (result.rows.length === 0) {
    return null
  }

  const user = result.rows[0]

  // Convert Date objects to ISO strings if needed
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    password: user.password,
    role: user.role,
    created_at: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
    updated_at: user.updated_at instanceof Date ? user.updated_at.toISOString() : user.updated_at
  }
}

/**
 * Updates a user's password.
 * Hashes the new password before storing.
 */
export const updateUserPassword = async (email: string, newPassword: string, options: ModuleOptions): Promise<void> => {
  const db = await useDb(options)
  const usersTable = options.tables.users

  // Validate password strength
  const passwordOptions = getPasswordValidationOptions(options)
  const passwordValidation = validatePassword(newPassword, passwordOptions)
  if (!passwordValidation.isValid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`)
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await db.sql`
    UPDATE {${usersTable}}
    SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
    WHERE email = ${email}
  `
}

interface CountResult {
  rows: Array<{ count: number }>
}

export const hasAnyUsers = async (options: ModuleOptions) => {
  try {
    const db = await useDb(options)

    const users = await db.sql`SELECT COUNT(*) as count FROM {${options.tables.users}}` as CountResult
    return users.rows?.[0]?.count > 0
  }
  catch {
    // If the table doesn't exist or connection fails, there are no users
    return false
  }
}

/**
 * Gets the current user from an authentication token.
 */
export const getCurrentUserFromToken = async (token: string, options: ModuleOptions): Promise<User | null> => {
  const db = await useDb(options)
  const personalAccessTokensTable = options.tables.personalAccessTokens
  const usersTable = options.tables.users

  // Find the token in the database
  const tokenResult = await db.sql`
    SELECT tokenable_id FROM {${personalAccessTokensTable}}
    WHERE token = ${token}
  ` as { rows: Array<{ tokenable_id: number }> }

  if (tokenResult.rows.length === 0) {
    return null
  }

  const userId = tokenResult.rows[0].tokenable_id

  // Get the user data
  const userResult = await db.sql`
    SELECT * FROM {${usersTable}}
    WHERE id = ${userId}
  ` as { rows: User[] }

  if (userResult.rows.length === 0) {
    return null
  }

  return userResult.rows[0]
}
