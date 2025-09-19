import { createTransport } from 'nodemailer'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { findUserByEmail, useDb } from '../utils'
import { validatePassword, getPasswordValidationOptions } from 'nuxt-users/utils'
import type { ModuleOptions, UserWithoutPassword } from 'nuxt-users/utils'

const TOKEN_EXPIRATION_HOURS = 24

interface RegistrationData {
  email: string
  name: string
  password: string
}

/**
 * Creates a new user with email confirmation required
 */
export const registerUser = async (
  userData: RegistrationData,
  options: ModuleOptions,
  baseUrl?: string
): Promise<{ user: Omit<UserWithoutPassword, 'active'>, message: string }> => {
  // Check if user already exists
  const existingUser = await findUserByEmail(userData.email, options)
  if (existingUser) {
    throw new Error('A user with this email already exists')
  }

  // Validate password strength
  const passwordOptions = getPasswordValidationOptions(options)
  const passwordValidation = validatePassword(userData.password, passwordOptions)
  if (!passwordValidation.isValid) {
    throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`)
  }

  const db = await useDb(options)
  const usersTable = options.tables.users

  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  // Generate confirmation token
  const confirmationToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = await bcrypt.hash(confirmationToken, 10)

  // Create user as inactive
  await db.sql`
    INSERT INTO {${usersTable}} (email, name, password, role, active, created_at, updated_at)
    VALUES (${userData.email}, ${userData.name}, ${hashedPassword}, 'user', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `

  // Get the created user
  const result = await db.sql`
    SELECT id, email, name, role, created_at, updated_at 
    FROM {${usersTable}} 
    WHERE email = ${userData.email}
  ` as { rows: Array<{ id: number, email: string, name: string, role: string, created_at: Date | string, updated_at: Date | string }> }

  if (result.rows.length === 0) {
    throw new Error('Failed to create user.')
  }

  const user = result.rows[0]

  // Store confirmation token (reuse the password_reset_tokens table structure for confirmation tokens)
  const passwordResetTokensTable = options.tables.passwordResetTokens
  await db.sql`
    INSERT INTO {${passwordResetTokensTable}} (email, token, created_at)
    VALUES (${userData.email}, ${hashedToken}, CURRENT_TIMESTAMP)
  `

  // Send confirmation email
  try {
    await sendConfirmationEmail(userData.email, userData.name, confirmationToken, options, baseUrl)
  }
  catch (emailError) {
    // Log email error but don't fail the registration
    console.error('[Nuxt Users] Failed to send confirmation email, but user was created successfully:', emailError)
    // In test environments or when email is misconfigured, we still want to return success
    // The user was created successfully, just the email sending failed
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
      updated_at: user.updated_at instanceof Date ? user.updated_at.toISOString() : user.updated_at
    },
    message: 'Registration successful! Please check your email to confirm your account.'
  }
}

/**
 * Sends a confirmation email to the newly registered user
 */
export const sendConfirmationEmail = async (
  email: string,
  name: string,
  token: string,
  options: ModuleOptions,
  baseUrl?: string
): Promise<void> => {
  if (!options.mailer) {
    console.error('[Nuxt Users] Mailer configuration is missing. Cannot send confirmation email.')
    return
  }

  const transporter = createTransport({
    host: options.mailer.host,
    port: options.mailer.port,
    secure: options.mailer.secure,
    auth: {
      user: options.mailer.auth.user,
      pass: options.mailer.auth.pass,
    },
  })

  // Construct the confirmation URL
  const appBaseUrl = baseUrl || 'http://localhost:3000'
  const confirmationUrl = new URL(`${options.apiBasePath}/confirm-email`, appBaseUrl)
  confirmationUrl.searchParams.set('token', token)
  confirmationUrl.searchParams.set('email', email)

  const confirmationLink = confirmationUrl.toString()

  try {
    await transporter.sendMail({
      from: options.mailer.defaults?.from || '"Nuxt Users" <noreply@example.com>',
      to: email,
      subject: 'Confirm your email address',
      text: `Hi ${name},

Welcome! Please click the following link to confirm your email address and activate your account:

${confirmationLink}

This link will expire in ${TOKEN_EXPIRATION_HOURS} hours.

If you did not create an account, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for registering! Please click the button below to confirm your email address and activate your account:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirm Email Address
            </a>
          </div>
          
          <p>Or copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
            <a href="${confirmationLink}">${confirmationLink}</a>
          </p>
          
          <p style="color: #6c757d; font-size: 14px;">
            This link will expire in ${TOKEN_EXPIRATION_HOURS} hours.
          </p>
          
          <p style="color: #6c757d; font-size: 14px;">
            If you did not create an account, please ignore this email. Your account will remain inactive.
          </p>
        </div>
      `,
    })
    console.log(`[Nuxt Users] Confirmation email sent to ${email}`)
  }
  catch (error) {
    console.error(`[Nuxt Users] Failed to send confirmation email to ${email}:`, error)
    throw error
  }
}

/**
 * Confirms a user's email address and activates their account
 */
export const confirmUserEmail = async (
  token: string,
  email: string,
  options: ModuleOptions
): Promise<boolean> => {
  const db = await useDb(options)
  const passwordResetTokensTable = options.tables.passwordResetTokens
  const usersTable = options.tables.users

  // Find potential tokens for the email
  const tokenRecords = await db.sql`
    SELECT * FROM {${passwordResetTokensTable}}
    WHERE email = ${email}
    ORDER BY created_at DESC
  ` as { rows: { id: number, email: string, token: string, created_at: Date | string }[] }

  if (tokenRecords.rows.length === 0) {
    console.log(`[Nuxt Users] No confirmation tokens found for email: ${email}`)
    return false
  }

  // Find matching token
  let validTokenRecord = null
  for (const record of tokenRecords.rows) {
    const tokenMatch = await bcrypt.compare(token, record.token)
    if (tokenMatch) {
      validTokenRecord = record
      break
    }
  }

  if (!validTokenRecord || !validTokenRecord.created_at) {
    console.log(`[Nuxt Users] Invalid confirmation token provided for email: ${email}`)
    return false
  }

  // Verify token expiration (24 hours) - using same pattern as password reset
  const now = new Date()
  const currentTimeString = now.toISOString().slice(0, 19).replace('T', ' ')

  // Parse the original timestamp and add expiration hours
  // Handle both Date objects and string timestamps from different databases
  const createdAtString = validTokenRecord.created_at instanceof Date
    ? validTokenRecord.created_at.toISOString().slice(0, 19).replace('T', ' ')
    : String(validTokenRecord.created_at)

  const [datePart, timePart] = createdAtString.split(/[ T]/)
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute, second] = timePart.split(':').map(Number)

  // Calculate expiration time by adding hours
  let expirationHour = hour + TOKEN_EXPIRATION_HOURS
  let expirationDay = day
  let expirationMonth = month
  let expirationYear = year

  // Handle day/month/year overflow when adding hours
  if (expirationHour >= 24) {
    expirationHour -= 24
    expirationDay++
    // Handle month overflow
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (expirationYear % 4 === 0 && (expirationYear % 100 !== 0 || expirationYear % 400 === 0)) {
      daysInMonth[1] = 29 // leap year
    }
    if (expirationDay > daysInMonth[expirationMonth - 1]) {
      expirationDay = 1
      expirationMonth++
      if (expirationMonth > 12) {
        expirationMonth = 1
        expirationYear++
      }
    }
  }

  const expirationTimeString = `${expirationYear.toString().padStart(4, '0')}-${expirationMonth.toString().padStart(2, '0')}-${expirationDay.toString().padStart(2, '0')} ${expirationHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`

  if (currentTimeString > expirationTimeString) {
    console.log(`[Nuxt Users] Expired confirmation token for email: ${email}`)
    // Clean up expired token
    await db.sql`DELETE FROM {${passwordResetTokensTable}} WHERE id = ${validTokenRecord.id}`
    return false
  }

  // Activate the user
  await db.sql`
    UPDATE {${usersTable}}
    SET active = true, updated_at = CURRENT_TIMESTAMP
    WHERE email = ${email}
  `

  // Clean up used token
  await db.sql`DELETE FROM {${passwordResetTokensTable}} WHERE id = ${validTokenRecord.id}`

  console.log(`[Nuxt Users] Email confirmed and user activated for: ${email}`)
  return true
}
