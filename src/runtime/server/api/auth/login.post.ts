import { defineEventHandler, readBody, createError } from 'h3'
import bcrypt from 'bcrypt'
import { randomUUID } from 'uncrypto'
import { hash } from 'ohash' // For hashing the token before storing
import {
  usersTable as usersTableGetter,
  personalAccessTokensTable as personalAccessTokensTableGetter,
  User,
  PersonalAccessToken
} from '../../utils/db'
import type { LoginRequest, LoginResponse, UserPublic } from '../../dto'
import { useRuntimeConfig } from '#imports'

// Helper function to generate a secure token (portion that is shown to user)
function generatePlainTextToken(): string {
  return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '') // Example: 64 chars, adjust length as needed
}

export default defineEventHandler(async (event): Promise<LoginResponse> => {
  const users = usersTableGetter.get()
  const personalAccessTokens = personalAccessTokensTableGetter.get()
  const { nuxtUsers } = useRuntimeConfig()
  const body = await readBody<LoginRequest>(event)

  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing email or password',
    })
  }

  const userRecord = await users.select().where({ email: body.email }).first()

  if (!userRecord || !userRecord.password) {
    throw createError({
      statusCode: 401, // Unauthorized
      statusMessage: 'Invalid credentials',
    })
  }

  const passwordMatch = await bcrypt.compare(body.password, userRecord.password)
  if (!passwordMatch) {
    throw createError({
      statusCode: 401, // Unauthorized
      statusMessage: 'Invalid credentials',
    })
  }

  // Create a new personal access token
  const plainTextToken = generatePlainTextToken()
  const hashedToken = hash(plainTextToken) // Hash the token for storage

  const tokenName = body.deviceName || 'login-token'
  const abilities = ['*'] // Default abilities

  const newAccessToken: Omit<PersonalAccessToken, 'id' | 'created_at' | 'updated_at'> = {
    user_id: userRecord.id,
    name: tokenName,
    token: hashedToken,
    abilities: JSON.stringify(abilities),
    // last_used_at will be updated when the token is used
    // expires_at can be set based on config (e.g., nuxtUsers.tokenExpiresInMinutes)
  }

  try {
    await personalAccessTokens.insert(newAccessToken as PersonalAccessToken)

    const publicUser: UserPublic = {
      id: userRecord.id,
      email: userRecord.email,
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at,
    }

    return {
      message: 'Login successful',
      token: plainTextToken,
      user: publicUser,
    }
  } catch (error: any) {
    console.error('Error during login (token creation):', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Login failed: ${error.message || 'Unknown error'}`,
    })
  }
})
