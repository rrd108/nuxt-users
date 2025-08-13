import { useDb } from './db'
import bcrypt from 'bcrypt'
import { validatePassword, getPasswordValidationOptions } from '../../../utils'
import type { ModuleOptions, User, UserWithoutPassword } from '../../../types'

interface CreateUserParams {
  email: string
  name: string
  password: string
  role?: string
  active?: boolean
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
  const result = await db.sql`SELECT id, email, name, role, created_at, updated_at, active FROM {${usersTable}} WHERE email = ${userData.email}` as { rows: Array<{ id: number, email: string, name: string, role: string, created_at: Date | string, updated_at: Date | string, active: boolean }> }

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
    updated_at: user.updated_at instanceof Date ? user.updated_at.toISOString() : user.updated_at,
    active: user.active
  }
}

/**
 * Finds a user by their email address.
 */
export const findUserByEmail = async (email: string, options: ModuleOptions): Promise<User | null> => {
  const db = await useDb(options)
  const usersTable = options.tables.users

  const result = await db.sql`SELECT * FROM {${usersTable}} WHERE email = ${email}` as { rows: Array<User> }

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
    created_at: user.created_at,
    updated_at: user.updated_at,
    active: user.active
  }
}

/**
 * Finds a user by their ID.
 */
export const findUserById = async <T extends boolean = false>(
  id: number,
  options: ModuleOptions,
  withPass: T = false as T
): Promise<T extends true ? User | null : UserWithoutPassword | null> => {
  const db = await useDb(options)
  const usersTable = options.tables.users

  const result = await db.sql`SELECT * FROM {${usersTable}} WHERE id = ${id}` as { rows: Array<User> }

  if (result.rows.length === 0) {
    return null
  }

  const user = result.rows[0]

  const normalizedUser = {
    ...user,
    created_at: typeof user.created_at === 'object' ? (user.created_at as Date).toISOString() : user.created_at,
    updated_at: typeof user.updated_at === 'object' ? (user.updated_at as Date).toISOString() : user.updated_at
  }

  if (withPass === true) {
    return normalizedUser as (T extends true ? (User | null) : (UserWithoutPassword | null))
  }

  const { password, ...userWithoutPassword } = normalizedUser
  return userWithoutPassword as (T extends true ? (User | null) : (UserWithoutPassword | null))
}

/**
 * Updates a user's details.
 */
export const updateUser = async (id: number, userData: Partial<User>, options: ModuleOptions): Promise<UserWithoutPassword> => {
  const db = await useDb(options)
  const usersTable = options.tables.users

  // Explicitly define which fields are allowed to be updated.
  // This prevents mass-assignment vulnerabilities.
  const allowedFields: (keyof User)[] = ['name', 'email', 'role', 'active']
  const updates: string[] = []
  const values: (string | number | boolean)[] = []

  for (const field of allowedFields) {
    if (userData[field] !== undefined) {
      updates.push(`${field} = ?`)
      values.push(userData[field])
    }
  }

  // If the user is being deactivated, revoke their tokens
  if (userData.active === false) {
    await revokeUserTokens(id, options)
  }

  // If no valid fields are provided, there's nothing to update.
  if (updates.length === 0) {
    const currentUser = await findUserById(id, options)
    if (!currentUser) {
      throw new Error('User not found.')
    }
    return currentUser
  }

  // Add the updated_at timestamp and the user ID for the WHERE clause
  updates.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)

  // Use db.sql with template parts for dynamic column names
  const setClause = updates.map(update => update.replace(' = ?', '')).join(', ')

  await db.sql`UPDATE {${usersTable}} SET {${setClause}} WHERE id = ${id}`

  const updatedUser = await findUserById(id, options)

  if (!updatedUser) {
    throw new Error('Failed to retrieve updated user.')
  }

  return updatedUser
}

/**
 * Deletes a user by their ID.
 */
export const deleteUser = async (id: number, options: ModuleOptions): Promise<void> => {
  const db = await useDb(options)
  const usersTable = options.tables.users

  const result = await db.sql`DELETE FROM {${usersTable}} WHERE id = ${id}`

  if (result.rows?.length === 0) {
    throw new Error('User not found or could not be deleted.')
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
export const getCurrentUserFromToken = async <T extends boolean = false>(
  token: string,
  options: ModuleOptions,
  withPass: T = false as T
): Promise<T extends true ? User | null : UserWithoutPassword | null> => {
  const db = await useDb(options)
  const personalAccessTokensTable = options.tables.personalAccessTokens
  const usersTable = options.tables.users

  // Find the token in the database and check if it's not expired
  const tokenResult = await db.sql`
    SELECT tokenable_id, expires_at FROM {${personalAccessTokensTable}}
    WHERE token = ${token}
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  ` as { rows: Array<{ tokenable_id: number, expires_at: string | null }> }

  if (tokenResult.rows.length === 0) {
    return null
  }

  const userId = tokenResult.rows[0].tokenable_id

  // Update last_used_at timestamp for the token
  await db.sql`
    UPDATE {${personalAccessTokensTable}}
    SET last_used_at = CURRENT_TIMESTAMP
    WHERE token = ${token}
  `

  // Get the user data
  const userResult = await db.sql`
    SELECT * FROM {${usersTable}}
    WHERE id = ${userId}
  ` as { rows: User[] }

  if (userResult.rows.length === 0) {
    return null
  }

  const user = userResult.rows[0]

  if (!user.active) {
    return null
  }

  if (withPass === true) {
    return user as T extends true ? User | null : UserWithoutPassword | null
  }

  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword as T extends true ? User | null : UserWithoutPassword | null
}

/**
 * Deletes expired personal access tokens from the database.
 */
export const deleteExpiredPersonalAccessTokens = async (options: ModuleOptions): Promise<number> => {
  const db = await useDb(options)
  const personalAccessTokensTable = options.tables.personalAccessTokens

  const result = await db.sql`
    DELETE FROM {${personalAccessTokensTable}}
    WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP
  `

  const deletedCount = result.rows?.length || 0
  console.log(`[Nuxt Users] ${deletedCount} expired personal access tokens deleted.`)
  return deletedCount
}

/**
 * Deletes tokens without expiration dates (legacy tokens or security cleanup).
 */
export const deleteTokensWithoutExpiration = async (options: ModuleOptions): Promise<number> => {
  const db = await useDb(options)
  const personalAccessTokensTable = options.tables.personalAccessTokens

  const result = await db.sql`
    DELETE FROM {${personalAccessTokensTable}}
    WHERE expires_at IS NULL
  `

  const deletedCount = result.rows?.length || 0
  console.log(`[Nuxt Users] ${deletedCount} tokens without expiration deleted.`)
  return deletedCount
}

/**
 * Comprehensive token cleanup: removes expired tokens and optionally tokens without expiration.
 */
export const cleanupPersonalAccessTokens = async (
  options: ModuleOptions,
  includeNoExpiration: boolean = true
): Promise<{ expiredCount: number, noExpirationCount: number, totalCount: number }> => {
  const expiredCount = await deleteExpiredPersonalAccessTokens(options)
  const noExpirationCount = includeNoExpiration ? await deleteTokensWithoutExpiration(options) : 0
  const totalCount = expiredCount + noExpirationCount

  console.log(`[Nuxt Users] Token cleanup completed: ${expiredCount} expired + ${noExpirationCount} without expiration = ${totalCount} total tokens removed.`)

  return { expiredCount, noExpirationCount, totalCount }
}

/**
 * Revokes all tokens for a specific user.
 */
export const revokeUserTokens = async (userId: number, options: ModuleOptions): Promise<void> => {
  const db = await useDb(options)
  const personalAccessTokensTable = options.tables.personalAccessTokens

  await db.sql`
    DELETE FROM {${personalAccessTokensTable}}
    WHERE tokenable_type = 'user' AND tokenable_id = ${userId}
  `

  console.log(`[Nuxt Users] All tokens revoked for user ID: ${userId}`)
}

/**
 * Gets the last login time for a user based on their most recent personal access token creation.
 * This represents when the user last successfully logged in.
 */
export const getLastLoginTime = async (userId: number, options: ModuleOptions): Promise<string | null> => {
  const db = await useDb(options)
  const personalAccessTokensTable = options.tables.personalAccessTokens

  const result = await db.sql`
    SELECT created_at 
    FROM {${personalAccessTokensTable}} 
    WHERE tokenable_id = ${userId} AND tokenable_type = 'user'
    ORDER BY created_at DESC 
    LIMIT 1
  ` as { rows: Array<{ created_at: Date | string }> }

  if (result.rows.length === 0) {
    return null
  }

  const lastLogin = result.rows[0].created_at

  // Convert Date objects to ISO strings if needed
  return lastLogin instanceof Date ? lastLogin.toISOString() : lastLogin
}
