import { createDatabase } from 'db0'
import { getConnector } from './db'
import bcrypt from 'bcrypt'
import type { ModuleOptions, User } from '../../../types'

interface CreateUserParams {
  email: string
  name: string
  password: string
}

/**
 * Creates a new user in the database.
 * Hashes the password before storing.
 */
export const createUser = async (userData: CreateUserParams, options: ModuleOptions): Promise<Omit<User, 'password'>> => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))
  const usersTable = options.tables.users

  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  // Insert the new user
  await db.sql`
    INSERT INTO {${usersTable}} (email, name, password, created_at, updated_at)
    VALUES (${userData.email}, ${userData.name}, ${hashedPassword}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `
  // Fetch the created user to return it (especially to get the ID and ensure it was created)
  // Exclude password in the return type
  const result = await db.sql`SELECT id, email, name, created_at, updated_at FROM {${usersTable}} WHERE email = ${userData.email}` as { rows: Array<{ id: number, email: string, name: string, created_at: Date | string, updated_at: Date | string }> }

  if (result.rows.length === 0) {
    throw new Error('Failed to retrieve created user.')
  }

  const user = result.rows[0]

  // Convert Date objects to ISO strings if needed
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
    updated_at: user.updated_at instanceof Date ? user.updated_at.toISOString() : user.updated_at
  }
}

/**
 * Finds a user by their email address.
 */
export const findUserByEmail = async (email: string, options: ModuleOptions): Promise<User | null> => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))
  const usersTable = options.tables.users

  const result = await db.sql`SELECT * FROM {${usersTable}} WHERE email = ${email}` as { rows: Array<{ id: number, email: string, name: string, password: string, created_at: Date | string, updated_at: Date | string }> }

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
    created_at: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
    updated_at: user.updated_at instanceof Date ? user.updated_at.toISOString() : user.updated_at
  }
}

/**
 * Updates a user's password.
 * Hashes the new password before storing.
 */
export const updateUserPassword = async (email: string, newPassword: string, options: ModuleOptions): Promise<void> => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))
  const usersTable = options.tables.users

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await db.sql`
    UPDATE {${usersTable}}
    SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
    WHERE email = ${email}
  `
}
