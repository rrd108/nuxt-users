import { createTransport } from 'nodemailer'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { findUserByEmail, updateUserPassword } from '../utils/user'
import { getConnector } from '../utils/db'
import { createDatabase } from 'db0'
import type { ModuleOptions, User } from '../../../types'
import type { H3Event } from 'h3' // For useRuntimeConfig

const TOKEN_EXPIRATION_HOURS = 1

/**
 * Generates a password reset link and sends it to the user's email.
 */
export const sendPasswordResetLink = async (
  email: string,
  event: H3Event, // To access runtimeConfig
): Promise<void> => {
  const { nuxtUsers } = useRuntimeConfig(event)
  const options = nuxtUsers as ModuleOptions

  const user = await findUserByEmail(email, options)

  if (!user) {
    // To prevent email enumeration, we don't throw an error here.
    // Log this event server-side if desired.
    console.log(`Password reset requested for non-existent email: ${email}`)
    return
  }

  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))

  // Generate a secure token
  const token = crypto.randomBytes(32).toString('hex')
  const hashedToken = await bcrypt.hash(token, 10) // Hash the token before storing

  // Store the hashed token, user's email, and creation date
  // Consider adding an expiry directly to the table if preferred
  await db.sql`
    INSERT INTO password_reset_tokens (email, token, created_at)
    VALUES (${email}, ${hashedToken}, CURRENT_TIMESTAMP)
  `

  // Construct the password reset URL
  const resetUrl = `${options.passwordResetBaseUrl || 'http://localhost:3000'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

  // Send email
  if (!options.mailer) {
    console.error('Mailer configuration is missing. Cannot send password reset email.')
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

  try {
    await transporter.sendMail({
      from: options.mailer.defaults?.from || '"Nuxt Users" <noreply@example.com>',
      to: email,
      subject: 'Password Reset Request',
      text: `Please click the following link to reset your password: ${resetUrl}`,
      html: `<p>Please click the following link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link will expire in ${TOKEN_EXPIRATION_HOURS} hour(s).</p>`,
    })
    console.log(`Password reset email sent to ${email}`)
  }
  catch (error) {
    console.error(`Failed to send password reset email to ${email}:`, error)
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
  event: H3Event, // To access runtimeConfig
): Promise<boolean> => {
  const { nuxtUsers } = useRuntimeConfig(event)
  const options = nuxtUsers as ModuleOptions

  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))

  // Find potential tokens for the email (could be multiple if user requested several times)
  const tokenRecords = await db.sql`
    SELECT * FROM password_reset_tokens
    WHERE email = ${email}
    ORDER BY created_at DESC
  ` as { rows: { id: number, email: string, token: string, created_at: string }[] }

  if (tokenRecords.rows.length === 0) {
    console.log(`No password reset tokens found for email: ${email}`)
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

  if (!validTokenRecord) {
    console.log(`Invalid password reset token provided for email: ${email}`)
    return false
  }

  // Verify token expiration
  const tokenCreatedAt = new Date(validTokenRecord.created_at)
  const expirationTime = new Date(tokenCreatedAt.getTime() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000)

  if (new Date() > expirationTime) {
    console.log(`Expired password reset token for email: ${email}`)
    // Clean up this specific expired token
    await db.sql`DELETE FROM password_reset_tokens WHERE id = ${validTokenRecord.id}`
    return false
  }

  // Update user's password
  await updateUserPassword(email, newPassword, options)

  // Delete the used token (and any other tokens for this email to be safe)
  await db.sql`DELETE FROM password_reset_tokens WHERE email = ${email}`

  console.log(`Password reset successful for email: ${email}`)
  return true
}

/**
 * Deletes expired password reset tokens from the database.
 */
export const deleteExpiredPasswordResetTokens = async (
  event: H3Event, // To access runtimeConfig
): Promise<void> => {
  const { nuxtUsers } = useRuntimeConfig(event)
  const options = nuxtUsers as ModuleOptions

  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))

  const expirationDate = new Date()
  expirationDate.setHours(expirationDate.getHours() - TOKEN_EXPIRATION_HOURS)

  // In SQLite, DATETIME('now', '-1 hour') could be used, but JS Date is more portable across DBs
  // Assuming created_at is stored in a format compatible with direct comparison or needs casting.
  // For SQLite, it's usually fine. For others, ensure proper date/time formatting/casting if issues arise.
  const result = await db.sql`
    DELETE FROM password_reset_tokens
    WHERE created_at < ${expirationDate.toISOString()}
  `
  // `result` might contain information about affected rows depending on db0 and the connector
  // For now, we'll just log. db0's `sql` template typically returns { rows: ... } or similar.
  // Specific connectors might offer row counts for DELETE operations.
  console.log(`Expired password reset tokens older than ${expirationDate.toISOString()} deleted.`)
}
