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
  const result = await db.sql`SELECT id, email, name, created_at, updated_at FROM {${usersTable}} WHERE email = ${userData.email}` as { rows: Omit<User, 'password'>[] }

  if (result.rows.length === 0) {
    throw new Error('Failed to retrieve created user.')
  }
  return result.rows[0]
}

/**
 * Finds a user by their email address.
 */
export const findUserByEmail = async (email: string, options: ModuleOptions): Promise<User | null> => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))
  const usersTable = options.tables.users

  const result = await db.sql`SELECT * FROM {${usersTable}} WHERE email = ${email}` as { rows: User[] }

  if (result.rows.length === 0) {
    return null
  }
  return result.rows[0]
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
