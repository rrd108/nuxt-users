import { defineEventHandler, getRequestHeader, createError } from 'h3'
import { hash } from 'ohash' // For hashing the provided token to match stored hash
import {
  usersTable as usersTableGetter,
  personalAccessTokensTable as personalAccessTokensTableGetter
} from '../../utils/db'
import type { UserPublic, AuthUserResponse } from '../../dto'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<AuthUserResponse> => {
  const users = usersTableGetter.get()
  const personalAccessTokens = personalAccessTokensTableGetter.get()
  const { nuxtUsers } = useRuntimeConfig()
  const authorizationHeader = getRequestHeader(event, 'Authorization')

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Missing or invalid token',
    })
  }

  const plainTextToken = authorizationHeader.substring('Bearer '.length)
  if (!plainTextToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Token is empty',
    })
  }

  const hashedToken = hash(plainTextToken)

  const accessTokenRecord = await personalAccessTokens.select()
    .where({ token: hashedToken })
    .first()

  if (!accessTokenRecord) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid token',
    })
  }

  // Optional: Check for token expiration
  if (accessTokenRecord.expires_at) {
    const expiryDate = new Date(accessTokenRecord.expires_at)
    if (expiryDate < new Date()) {
      await personalAccessTokens.delete().where({ id: accessTokenRecord.id })
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Token expired',
      })
    }
  }

  // Update last_used_at
  try {
    await personalAccessTokens.update({ last_used_at: new Date().toISOString() })
      .where({ id: accessTokenRecord.id })
  } catch (error) {
    console.warn('Failed to update token last_used_at:', error) // Changed to warn as it's non-critical
  }

  const userRecord = await users.select({ id: true, email: true, created_at: true, updated_at: true })
    .where({ id: accessTokenRecord.user_id })
    .first()

  if (!userRecord) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: User not found for token',
    })
  }

  const publicUser: UserPublic = {
      id: userRecord.id,
      email: userRecord.email,
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at,
  };

  return {
    user: publicUser,
    // Optionally, return token abilities or other relevant session info
    // abilities: JSON.parse(accessTokenRecord.abilities || '[]')
  }
})
