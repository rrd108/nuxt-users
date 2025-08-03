import { defineCommand } from 'citty'
import { createUser } from 'nuxt-users'
import { validatePassword, getPasswordValidationOptions } from '../utils'
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
    },
    role: {
      alias: 'r',
      type: 'string',
      description: 'User role (defaults to "user")',
      default: 'user'
    }
  },
  async run({ args }) {
    const { email, name, password, role } = args

    const options = await loadOptions()

    try {
      // Validate password strength before creating user
      const passwordOptions = getPasswordValidationOptions(options)
      const passwordValidation = validatePassword(password, passwordOptions)
      if (!passwordValidation.isValid) {
        console.error('[Nuxt Users] Password validation failed:')
        passwordValidation.errors.forEach(error => console.error(`  - ${error}`))
        process.exit(1)
      }

      const user = await createUser({ email, name, password, role }, options)
      console.log(`[Nuxt Users] User created successfully: ${user.email} (role: ${user.role})`)
      process.exit(0)
    }
    catch (error) {
      console.error('[Nuxt Users] Error:', error)
      process.exit(1)
    }
  }
})
