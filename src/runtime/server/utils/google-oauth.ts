import { google } from 'googleapis'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import type { ModuleOptions, User, GoogleOAuthOptions } from 'nuxt-users/utils'
import { useDb } from './db'

export interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture?: string
  verified_email: boolean
}

/**
 * Create Google OAuth2 client
 */
export function createGoogleOAuth2Client(options: GoogleOAuthOptions, callbackUrl: string) {
  return new google.auth.OAuth2(
    options.clientId,
    options.clientSecret,
    callbackUrl
  )
}

/**
 * Generate authorization URL for Google OAuth
 */
export function getGoogleAuthUrl(oauth2Client: any, options: GoogleOAuthOptions): string {
  const scopes = options.scopes || ['openid', 'profile', 'email']
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
  })
}

/**
 * Exchange authorization code for tokens and get user info
 */
export async function getGoogleUserFromCode(oauth2Client: any, code: string): Promise<GoogleUserInfo> {
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const { data } = await oauth2.userinfo.get()

  if (!data.email || !data.verified_email) {
    throw new Error('Google account email not verified')
  }

  return {
    id: data.id!,
    email: data.email,
    name: data.name || data.email.split('@')[0],
    picture: data.picture,
    verified_email: data.verified_email
  }
}

/**
 * Generate a secure random password for OAuth users
 */
export async function generateSecurePassword(): Promise<string> {
  // Generate a 32-byte random string and hash it
  const randomBytes = crypto.randomBytes(32).toString('hex')
  return await bcrypt.hash(`OAUTH_${randomBytes}`, 10)
}

/**
 * Find or create user from Google OAuth data
 */
export async function findOrCreateGoogleUser(
  googleUser: GoogleUserInfo, 
  moduleOptions: ModuleOptions
): Promise<User | null> {
  const db = await useDb(moduleOptions)
  const usersTable = moduleOptions.tables.users
  const allowAutoRegistration = moduleOptions.auth.google?.allowAutoRegistration ?? false

  // First, try to find existing user by google_id
  let userResult = await db.sql`
    SELECT * FROM {${usersTable}} 
    WHERE google_id = ${googleUser.id}
  ` as { rows: User[] }

  if (userResult.rows.length > 0) {
    const user = userResult.rows[0]
    
    // Update profile picture if it has changed
    if (user.profile_picture !== googleUser.picture) {
      await db.sql`
        UPDATE {${usersTable}} 
        SET profile_picture = ${googleUser.picture}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user.id}
      `
      user.profile_picture = googleUser.picture
    }
    
    return user
  }

  // Try to find existing user by email
  userResult = await db.sql`
    SELECT * FROM {${usersTable}} 
    WHERE email = ${googleUser.email}
  ` as { rows: User[] }

  if (userResult.rows.length > 0) {
    // User exists with same email, link Google account
    const user = userResult.rows[0]
    await db.sql`
      UPDATE {${usersTable}} 
      SET google_id = ${googleUser.id}, 
          profile_picture = ${googleUser.picture},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `
    
    user.google_id = googleUser.id
    user.profile_picture = googleUser.picture
    return user
  }

  // Check if auto-registration is allowed
  if (!allowAutoRegistration) {
    return null
  }

  // Create new user
  const securePassword = await generateSecurePassword()
  
  const insertResult = await db.sql`
    INSERT INTO {${usersTable}} (
      email, name, password, role, google_id, profile_picture, 
      active, created_at, updated_at
    ) VALUES (
      ${googleUser.email}, 
      ${googleUser.name}, 
      ${securePassword},
      'user',
      ${googleUser.id},
      ${googleUser.picture || null},
      true,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
  `

  // Get the created user
  const createdUserResult = await db.sql`
    SELECT * FROM {${usersTable}} 
    WHERE google_id = ${googleUser.id}
  ` as { rows: User[] }

  return createdUserResult.rows[0]
}

/**
 * Create authentication token for user (reusing existing logic)
 */
export async function createAuthTokenForUser(
  user: User, 
  moduleOptions: ModuleOptions,
  rememberMe = false
): Promise<string> {
  const db = await useDb(moduleOptions)
  const personalAccessTokensTable = moduleOptions.tables.personalAccessTokens
  
  const token = crypto.randomBytes(64).toString('hex')
  const tokenName = 'oauth_auth_token'

  // Calculate expiration time
  const expiresAt = new Date()
  if (rememberMe) {
    const longTermDays = moduleOptions.auth.rememberMeExpiration || 30
    expiresAt.setDate(expiresAt.getDate() + longTermDays)
  } else {
    expiresAt.setMinutes(expiresAt.getMinutes() + moduleOptions.auth.tokenExpiration)
  }

  // Store the token
  await db.sql`
    INSERT INTO {${personalAccessTokensTable}} (
      tokenable_type, tokenable_id, name, token, expires_at, created_at, updated_at
    ) VALUES (
      'user', 
      ${user.id}, 
      ${tokenName}, 
      ${token}, 
      ${expiresAt.toISOString().slice(0, 19).replace('T', ' ')}, 
      CURRENT_TIMESTAMP, 
      CURRENT_TIMESTAMP
    )
  `

  return token
}