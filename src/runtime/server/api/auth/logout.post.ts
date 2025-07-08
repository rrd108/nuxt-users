import { defineEventHandler, getRequestHeader, createError } from 'h3'
import { hash } from 'ohash' // For hashing the provided token
import { personalAccessTokensTable as personalAccessTokensTableGetter } from '../../utils/db'
import type { MessageResponse } from '../../dto'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<MessageResponse> => {
  const personalAccessTokens = personalAccessTokensTableGetter.get()
  const { nuxtUsers } = useRuntimeConfig()
  const authorizationHeader = getRequestHeader(event, 'Authorization')

  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
    const plainTextToken = authorizationHeader.substring('Bearer '.length)

    if (plainTextToken) {
      const hashedToken = hash(plainTextToken)

      try {
        // The actual return type of `execute()` or if it throws on "not found" depends on db0 driver.
        // Assuming it doesn't throw if no record matches the where clause for deletion.
        await personalAccessTokens.delete().where({ token: hashedToken }).execute()
        // We can't easily tell if a token was actually deleted or just not found without more info from db0's delete.
        // For logout, the goal is to ensure the token is no longer valid. If it's not found, it's already invalid.
        console.log('Token invalidation attempt finished for token associated with the request.')
      } catch (error: any) {
        // Log error but proceed to ensure client-side logout can complete
        console.error('Error during token invalidation on server:', error.message)
      }
    }
  }

  // No need to clear specific cookies here if Authorization Bearer token is the primary mechanism.
  // Client-side `useAuth` is responsible for clearing its local token store (cookie).

  return {
    message: 'Logout successful. Any active session token has been invalidated.',
  }
})
