import { defineEventHandler, readBody, createError } from 'h3'
import bcrypt from 'bcrypt'
import { usersTable as usersTableGetter, User } from '../../utils/db'
import type { RegisterRequest, RegisterResponse, UserPublic } from '../../dto'
import { useRuntimeConfig } from '#imports'

const SALT_ROUNDS = 10

export default defineEventHandler(async (event): Promise<RegisterResponse> => {
  const users = usersTableGetter.get()
  const { nuxtUsers } = useRuntimeConfig()
  const body = await readBody<RegisterRequest>(event)

  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing email or password',
    })
  }

  // Basic email validation
  if (!/.+@.+\..+/.test(body.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email format',
    })
  }

  // Basic password length validation
  if (body.password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 8 characters long',
    })
  }

  const existingUser = await users.select().where({ email: body.email }).first()

  if (existingUser) {
    throw createError({
      statusCode: 409, // Conflict
      statusMessage: 'User with this email already exists',
    })
  }

  const hashedPassword = await bcrypt.hash(body.password, SALT_ROUNDS)

  const newUser: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
    email: body.email,
    password: hashedPassword,
  }

  try {
    await users.insert(newUser as User) // db0 handles ID generation

    const createdUserRecord = await users.select({ id: true, email: true, created_at: true, updated_at: true })
      .where({ email: body.email })
      .first()

    if (!createdUserRecord) {
      console.error('Failed to fetch user after insert:', body.email)
      throw createError({
        statusCode: 500,
        statusMessage: 'User registration completed but failed to retrieve user details.',
      })
    }

    // Ensure the returned user object matches UserPublic structure
    const publicUser: UserPublic = {
        id: createdUserRecord.id,
        email: createdUserRecord.email,
        created_at: createdUserRecord.created_at,
        updated_at: createdUserRecord.updated_at,
    };

    return {
      message: 'User registered successfully',
      user: publicUser,
    }
  } catch (error: any) {
    console.error('Error during user registration:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to register user: ${error.message || 'Unknown error'}`,
    })
  }
})
