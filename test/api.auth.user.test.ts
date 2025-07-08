import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import {
  usersTable as usersTableGetter,
  personalAccessTokensTable as personalAccessTokensTableGetter
} from '../src/runtime/server/utils/db'
import type { LoginRequest, LoginResponse, RegisterRequest, UserPublic, AuthUserResponse } from '../src/runtime/server/dto'

const nuxtUsersTestConfig = {
  nuxtUsers: { dbTestMode: true, runMigrations: true, apiBasePath: '/auth' },
}

describe('GET /auth/user', async () => {
  // @ts-ignore
  await setup({
    nuxtConfig: {
      runtimeConfig: { ...nuxtUsersTestConfig },
      modules: ['../src/module'],
    }
  })

  const usersTable = usersTableGetter.get()
  const personalAccessTokensTable = personalAccessTokensTableGetter.get()
  let authToken: string
  let registeredUser: UserPublic
  const testPassword = 'password123'

  beforeEach(async () => {
    // Clean tables
    const allTokens = await personalAccessTokensTable.select().all()
    for (const token of allTokens) {
      await personalAccessTokensTable.delete().where({ id: token.id }).execute()
    }
    const allUsers = await usersTable.select().all()
    for (const user of allUsers) {
      await usersTable.delete().where({ id: user.id }).execute()
    }

    // Register and login a user
    const email = `user-${Date.now()}@example.com`
    await $fetch<any>('/auth/register', {
      method: 'POST',
      body: { email, password: testPassword } as RegisterRequest
    })

    const loginResponse = await $fetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password: testPassword } as LoginRequest,
    })
    authToken = loginResponse.token
    registeredUser = loginResponse.user
  })

  it('should fetch authenticated user with a valid token', async () => {
    const response = await $fetch<AuthUserResponse>('/auth/user', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
    })

    expect(response.user).toBeDefined()
    expect(response.user.email).toBe(registeredUser.email)
    expect(response.user.id).toBe(registeredUser.id)
  })

  it('should fail with 401 if token is invalid', async () => {
    try {
      await $fetch<AuthUserResponse>('/auth/user', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer invalidtoken123' },
      })
      expect(true).toBe(false) // Should not reach here
    } catch (error: any) {
      expect(error.statusCode).toBe(401)
      expect(error.data.statusMessage).toContain('Invalid token')
    }
  })

  it('should fail with 401 if token is missing', async () => {
    try {
      await $fetch<AuthUserResponse>('/auth/user', { method: 'GET' })
      expect(true).toBe(false)
    } catch (error: any) {
      expect(error.statusCode).toBe(401)
      expect(error.data.statusMessage).toContain('Missing or invalid token')
    }
  })

  it('should update last_used_at for the token', async () => {
    const initialTokenState = await personalAccessTokensTable.select().where({ user_id: registeredUser.id }).first();
    expect(initialTokenState?.last_used_at).toBeNull(); // Or undefined, depending on db0 behavior for new records

    await $fetch<AuthUserResponse>('/auth/user', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    const updatedTokenState = await personalAccessTokensTable.select().where({ user_id: registeredUser.id }).first();
    expect(updatedTokenState?.last_used_at).toBeDefined();
    expect(updatedTokenState?.last_used_at).not.toBeNull();
  });
})
