import { useDb } from './db'
import bcrypt from 'bcrypt'
import { deletePasskeysForUser } from './passkey'
import { revokeEmailTokens } from './email-token'
import { validatePassword, getPasswordValidationOptions, assertValidRole } from 'nuxt-users/utils'
import type { ModuleOptions, User, UserWithoutPassword } from 'nuxt-users/utils'

interface CreateUserParams {
  email: string
  name: string
  password: string
  role?: string
  active?: boolean
}

export const USER_EMAIL_ALREADY_EXISTS_MESSAGE = 'A user with this email already exists'

/**
 * Creates a new user in the database.
 * Hashes the password before storing.
 */
export const createUser = async (userData: CreateUserParams, options: ModuleOptions): Promise<Omit<User, 'password'>> => {
  const db = await useDb(options)
  const usersTable = options.tables.users

  const existingUser = await findUserByEmail(userData.email, options)
  if (existingUser) {
    throw new Error(USER_EMAIL_ALREADY_EXISTS_MESSAGE)
  }

  // Validate password strength
  const passwordOptions = getPasswordValidationOptions(options)
  const passwordValidation = validatePassword(userData.password, passwordOptions)
  if (!passwordValidation.isValid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`)
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  // Set default role if not provided, then validate against permissions
  const role = assertValidRole(userData.role || 'user', {
    permissions: options.auth.permissions,
    allowCustomRoles: options.auth.allowCustomRoles
  })

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
  if (!user) {
    throw new Error('Failed to retrieve created user.')
  }

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
  if (!user) {
    return null
  }

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
  if (!user) {
    return null
  }

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

  const allowedFields: (keyof User)[] = ['name', 'email', 'role', 'active']
  const fieldsToUpdate = allowedFields.filter(field => userData[field] !== undefined)

  // If no valid fields are provided, there's nothing to update.
  if (fieldsToUpdate.length === 0) {
    const currentUser = await findUserById(id, options)
    if (!currentUser) {
      throw new Error('User not found.')
    }
    return currentUser
  }

  if (userData.role !== undefined) {
    userData.role = assertValidRole(userData.role, {
      permissions: options.auth.permissions,
      allowCustomRoles: options.auth.allowCustomRoles
    })
  }

  // If the user is being deactivated, revoke their sessions and email tokens:
  // an old confirmation link must not reactivate them
  if (userData.active === false) {
    await revokeUserTokens(id, options)
    const current = await findUserById(id, options)
    if (current) {
      await revokeEmailTokens(current.email, options)
    }
  }

  for (const field of fieldsToUpdate) {
    await db.sql`UPDATE {${usersTable}} SET {${field}} = ${userData[field]} WHERE id = ${id}`
  }
  await db.sql`UPDATE {${usersTable}} SET updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`

  const updatedUser = await findUserById(id, options)

  if (!updatedUser) {
    throw new Error('Failed to retrieve updated user.')
  }

  return updatedUser
}

/**
 * Deletes a user by their ID.
 * By default deactivates the user (sets active to false).
 * If hardDelete option is true, deletes them permanently.
 * In both cases, their sessions and email tokens are revoked.
 */
export const deleteUser = async (id: number, options: ModuleOptions): Promise<void> => {
  const db = await useDb(options)
  const usersTable = options.tables.users

  // Check if user exists first
  const userExists = await db.sql`SELECT id, email FROM {${usersTable}} WHERE id = ${id}` as { rows: Array<{ id: number, email: string }> }

  const existing = userExists.rows[0]
  if (!existing) {
    throw new Error('User not found.')
  }

  // Always revoke the user's sessions and email tokens first
  await revokeUserTokens(id, options)
  await revokeEmailTokens(existing.email, options)

  if (options.hardDelete) {
    // Hard delete - permanently remove from database
    await db.sql`DELETE FROM {${usersTable}} WHERE id = ${id}`
    // A failure here must not block the delete, but is logged: it would leave orphaned passkeys behind
    await deletePasskeysForUser(options, id).catch((error) => {
      console.warn(`[Nuxt Users] Could not delete the passkeys of user ${id}:`, error)
    })
    return
  }

  // Soft delete - set active to false
  await db.sql`UPDATE {${usersTable}} SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`
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
    const firstRow = users.rows?.[0]
    return firstRow ? firstRow.count > 0 : false
  }
  catch {
    // If the table doesn't exist or connection fails, there are no users
    return false
  }
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
 * Pass `exceptToken` to keep one session (e.g. the one that just changed the password).
 */
export const revokeUserTokens = async (userId: number, options: ModuleOptions, exceptToken?: string): Promise<void> => {
  const db = await useDb(options)
  const personalAccessTokensTable = options.tables.personalAccessTokens

  if (exceptToken) {
    await db.sql`
      DELETE FROM {${personalAccessTokensTable}}
      WHERE tokenable_type = 'user' AND tokenable_id = ${userId} AND token <> ${exceptToken}
    `
    console.log(`[Nuxt Users] Other tokens revoked for user ID: ${userId}`)
    return
  }

  await db.sql`
    DELETE FROM {${personalAccessTokensTable}}
    WHERE tokenable_type = 'user' AND tokenable_id = ${userId}
  `

  console.log(`[Nuxt Users] All tokens revoked for user ID: ${userId}`)
}
