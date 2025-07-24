import { defineCommand } from 'citty'
import { createUser } from '../utils'
import { loadOptions } from './utils'

export default defineCommand({
  meta: {
    name: 'create-user',
    description: 'Create a new user in the database'
  },
  args: {
    email: {
      alias: 'e',
      type: 'string',
      description: 'User email address',
      required: true
    },
    name: {
      alias: 'n',
      type: 'string',
      description: 'User full name',
      required: true
    },
    password: {
      alias: 'p',
      type: 'string',
      description: 'User password',
      required: true
    }
  },
  async run({ args }) {
    const { email, name, password } = args

    const options = await loadOptions()

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
})
