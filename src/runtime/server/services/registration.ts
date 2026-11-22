import { createTransport } from 'nodemailer'
import bcrypt from 'bcrypt'
import { findUserByEmail, useDb, USER_EMAIL_ALREADY_EXISTS_MESSAGE } from '../utils'
import { escapeHtml } from '../utils/escape-html'
import { issueEmailToken, consumeEmailToken, EMAIL_TOKEN_TTL_HOURS } from '../utils/email-token'
import { validatePassword, getPasswordValidationOptions } from 'nuxt-users/utils'
import type { ModuleOptions, UserWithoutPassword } from 'nuxt-users/utils'

const TOKEN_EXPIRATION_HOURS = EMAIL_TOKEN_TTL_HOURS.email_confirmation

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
    throw new Error(USER_EMAIL_ALREADY_EXISTS_MESSAGE)
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
  if (!user) {
    throw new Error('Failed to retrieve created user.')
  }

  const confirmationToken = await issueEmailToken(userData.email, 'email_confirmation', options)

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
  // name is user-supplied: escape everything interpolated into the HTML body
  const safeName = escapeHtml(name)
  const safeLink = escapeHtml(confirmationLink)

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
          <h2>Welcome, ${safeName}!</h2>
          <p>Thank you for registering! Please click the button below to confirm your email address and activate your account:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${safeLink}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirm Email Address
            </a>
          </div>
          
          <p>Or copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
            <a href="${safeLink}">${safeLink}</a>
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
  if (!await consumeEmailToken(email, token, 'email_confirmation', options)) {
    return false
  }

  const db = await useDb(options)
  const usersTable = options.tables.users

  // Activate the user
  await db.sql`
    UPDATE {${usersTable}}
    SET active = true, updated_at = CURRENT_TIMESTAMP
    WHERE email = ${email}
  `

  console.log(`[Nuxt Users] Email confirmed and user activated for: ${email}`)
  return true
}
