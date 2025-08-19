import { createTransport } from 'nodemailer'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { findUserByEmail, updateUserPassword, useDb } from '../utils'
import type { ModuleOptions } from 'nuxt-users/utils'

const TOKEN_EXPIRATION_HOURS = 1

/**
 * Generates a password reset link and sends it to the user's email.
 */
export const sendPasswordResetLink = async (
  email: string,
  options: ModuleOptions,
  baseUrl?: string): Promise<void> => {
  const user = await findUserByEmail(email, options)

  if (!user) {
    // To prevent email enumeration, we don't throw an error here.
    // Log this event server-side if desired.
    console.log(`[Nuxt Users] Password reset requested for non-existent email: ${email}`)
    return
  }

  const db = await useDb(options)

  // Generate a secure token
  const token = crypto.randomBytes(32).toString('hex')
  const hashedToken = await bcrypt.hash(token, 10) // Hash the token before storing

  const passwordResetTokensTable = options.tables.passwordResetTokens

  // Store the hashed token, user's email, and creation date
  // Consider adding an expiry directly to the table if preferred
  await db.sql`
    INSERT INTO {${passwordResetTokensTable}} (email, token, created_at)
    VALUES (${email}, ${hashedToken}, CURRENT_TIMESTAMP)
  `

  // Send email
  if (!options.mailer) {
    console.error('[Nuxt Users] Mailer configuration is missing. Cannot send password reset email.')
    // Potentially throw an error or handle this case based on application requirements
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

  // Construct the complete password reset URL with token and email
  // Use the provided baseUrl, or fall back to a sensible default for development
  const appBaseUrl = baseUrl || 'http://localhost:3000'
  const resetUrl = new URL(options.passwordResetUrl, appBaseUrl)
  resetUrl.searchParams.set('token', token)
  resetUrl.searchParams.set('email', email)

  const resetLink = resetUrl.toString()

  try {
    await transporter.sendMail({
      from: options.mailer.defaults?.from || '"Nuxt Users" <noreply@example.com>',
      to: email,
      subject: 'Password Reset Request',
      text: `Please click the following link to reset your password: ${resetLink}

This link will expire in ${TOKEN_EXPIRATION_HOURS} hour(s).

If you did not request this password reset, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Please click the button below to set a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
            <a href="${resetLink}">${resetLink}</a>
          </p>
          
          <p style="color: #6c757d; font-size: 14px;">
            This link will expire in ${TOKEN_EXPIRATION_HOURS} hour(s).
          </p>
          
          <p style="color: #6c757d; font-size: 14px;">
            If you did not request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
      `,
    })
    console.log(`[Nuxt Users] Password reset email sent to ${email}`)
  }
  catch (error) {
    console.error(`[Nuxt Users] Failed to send password reset email to ${email}:`, error)
    // Handle email sending failure (e.g., log, notify admin)
  }
}

/**
 * Resets the user's password using a valid token.
 */
export const resetPassword = async (
  token: string,
  email: string, // Added email to quickly find the token
  newPassword: string,
  options: ModuleOptions): Promise<boolean> => {
  const db = await useDb(options)
  const passwordResetTokensTable = options.tables.passwordResetTokens

  // Find potential tokens for the email (could be multiple if user requested several times)
  const tokenRecords = await db.sql`
    SELECT * FROM {${passwordResetTokensTable}}
    WHERE email = ${email}
    ORDER BY created_at DESC
  ` as { rows: { id: number, email: string, token: string, created_at: string }[] }

  if (tokenRecords.rows.length === 0) {
    console.log(`[Nuxt Users] No password reset tokens found for email: ${email}`)
    return false
  }

  let validTokenRecord = null
  for (const record of tokenRecords.rows) {
    const tokenMatch = await bcrypt.compare(token, record.token)
    if (tokenMatch) {
      validTokenRecord = record
      break
    }
  }

  if (!validTokenRecord || !validTokenRecord.created_at) {
    console.log(`[Nuxt Users] Invalid password reset token provided for email: ${email}`)
    return false
  }

  // Verify token expiration
  // Work with the database timestamp directly to avoid timezone issues
  // The database stores timestamps as 'YYYY-MM-DD HH:MM:SS' in local time

  // Get current time in the same format as the database
  const now = new Date()
  const currentTimeString = now.toISOString().slice(0, 19).replace('T', ' ')

  // Parse the original timestamp and add expiration hours
  const [datePart, timePart] = validTokenRecord.created_at.split(/[ T]/) // Split on space or T
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute, second] = timePart.split(':').map(Number)

  // Calculate expiration time by adding hours
  let expirationHour = hour + TOKEN_EXPIRATION_HOURS
  let expirationDay = day
  const expirationMonth = month
  const expirationYear = year

  // Handle day/month/year overflow when adding hours
  if (expirationHour >= 24) {
    expirationHour -= 24
    expirationDay++
    // Simple overflow handling - in production you might want more sophisticated date math
  }

  const expirationTimeString = `${expirationYear.toString().padStart(4, '0')}-${expirationMonth.toString().padStart(2, '0')}-${expirationDay.toString().padStart(2, '0')} ${expirationHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`

  if (currentTimeString > expirationTimeString) {
    console.log(`[Nuxt Users] Expired password reset token for email: ${email}`)
    // Clean up this specific expired token
    await db.sql`DELETE FROM {${passwordResetTokensTable}} WHERE id = ${validTokenRecord.id}`
    return false
  }

  // Update user's password
  await updateUserPassword(email, newPassword, options)

  // Delete the used token (and any other tokens for this email to be safe)
  await db.sql`DELETE FROM {${passwordResetTokensTable}} WHERE email = ${email}`

  console.log(`[Nuxt Users] Password reset successful for email: ${email}`)
  return true
}

/**
 * Deletes expired password reset tokens from the database.
 */
export const deleteExpiredPasswordResetTokens = async (
  options: ModuleOptions): Promise<void> => {
  const db = await useDb(options)
  const passwordResetTokensTable = options.tables.passwordResetTokens

  const expirationDate = new Date()
  expirationDate.setHours(expirationDate.getHours() - TOKEN_EXPIRATION_HOURS)

  // Use ISO format for database comparison since that's how timestamps are stored
  const expirationDateString = expirationDate.toISOString()

  await db.sql`
    DELETE FROM {${passwordResetTokensTable}}
    WHERE created_at < ${expirationDateString}
  `

  console.log(`[Nuxt Users] Expired password reset tokens older than ${expirationDateString} deleted.`)
}
