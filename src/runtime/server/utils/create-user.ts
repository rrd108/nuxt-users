import { createDatabase } from 'db0'
import { getConnector } from './db'
import bcrypt from 'bcrypt'
import type { ModuleOptions } from '../../../types'

interface CreateUserOptions {
  email: string
  name: string
  password: string
}

export const createUser = async (userData: CreateUserOptions, options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))

  console.log(`[DB:Create User] Creating user with ${connectorName} connector...`)

  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  // Insert the new user
  await db.sql`
    INSERT INTO users (email, name, password, created_at, updated_at)
    VALUES (${userData.email}, ${userData.name}, ${hashedPassword}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `

  console.log('[DB:Create User] User created successfully!')
  console.log(`[DB:Create User] Email: ${userData.email}`)
  console.log(`[DB:Create User] Name: ${userData.name}`)

  // Fetch the created user to return it (especially to get the ID)
  const result = await db.sql`SELECT id, email, name, created_at, updated_at FROM users WHERE email = ${userData.email}` as { rows: any[] }
  if (result.rows.length === 0) {
    throw new Error('Failed to retrieve created user.')
  }
  return result.rows[0]
}

// Default options
const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/db.sqlite3',
    },
  },
}

const createUserDefault = async () => {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.error('[DB:Create User] Usage: yarn create:user <email> <name> <password>')
    console.error('[DB:Create User] Example: yarn create:user john@example.com "John Doe" mypassword')
    process.exit(1)
  }

  const [email, name, password] = args

  console.log('[DB:Create User] Starting user creation...')

  try {
    await createUser({ email, name, password }, defaultOptions)
    process.exit(0)
  }
  catch (error) {
    console.error('[DB:Create User] Error:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (process.argv[1] && process.argv[1].endsWith('create-user.ts')) {
  createUserDefault()
}
