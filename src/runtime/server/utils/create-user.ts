import { createUser } from './user' // Import from the new user utility file
import type { ModuleOptions } from '../../../types'

// Default options for the CLI script
const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/db.sqlite3',
    },
  },
  // tables config is not strictly needed by createUser directly but part of ModuleOptions
  tables: {
    users: true,
    personalAccessTokens: false, // Assuming not relevant for direct user creation script
    passwordResetTokens: false, // Assuming not relevant for direct user creation script
  }
}

const runCreateUserCLI = async () => {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.error('[DB:Create User] Usage: yarn create:user <email> <name> <password>')
    console.error('[DB:Create User] Example: yarn create:user john@example.com "John Doe" mypassword')
    process.exit(1)
  }

  const [email, name, password] = args

  console.log('[DB:Create User CLI] Starting user creation...')

  try {
    const newUser = await createUser({ email, name, password }, defaultOptions)
    console.log('[DB:Create User CLI] User created successfully!')
    console.log(`[DB:Create User CLI] ID: ${newUser.id}`)
    console.log(`[DB:Create User CLI] Email: ${newUser.email}`)
    console.log(`[DB:Create User CLI] Name: ${newUser.name}`)
    process.exit(0)
  }
  catch (error) {
    console.error('[DB:Create User CLI] Error:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (process.argv[1] && process.argv[1].endsWith('create-user.ts')) {
  runCreateUserCLI()
}
