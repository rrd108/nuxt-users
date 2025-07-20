import { defineCommand } from 'citty'
import { createUser } from '../utils'
import { getOptionsFromEnv } from './utils'

export default defineCommand({
  meta: {
    name: 'create-user',
    description: 'Create a new user in the database'
  },
  args: {
    email: {
      type: 'string',
      description: 'User email address',
      required: true
    },
    name: {
      type: 'string',
      description: 'User full name',
      required: true
    },
    password: {
      type: 'string',
      description: 'User password',
      required: true
    }
  },
  async run({ args }) {
    const { email, name, password } = args
    const options = getOptionsFromEnv()

    try {
      const user = await createUser({ email, name, password }, options)
      console.log(`[DB:Create User] User created successfully: ${user.email}`)
    }
    catch (error) {
      console.error('[DB:Create User] Error:', error)
      process.exit(1)
    }
  }
})
