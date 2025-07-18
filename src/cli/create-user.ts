import { useRuntimeConfig } from '#imports'
import { createUser } from '../runtime/server/utils/user'
import type { ModuleOptions } from '../types'

const createUserDefault = async () => {
  const args = process.argv.slice(2)
  if (args.length < 3) {
    console.error('Usage: yarn db:create-user <email> <name> <password>')
    process.exit(1)
  }

  const [email, name, password] = args
  const options = useRuntimeConfig().nuxtUsers as ModuleOptions

  try {
    const user = await createUser({ email, name, password }, options)
    console.log(`[DB:Create User] User created successfully: ${user.email}`)
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
