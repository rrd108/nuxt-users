import { createTransport } from 'nodemailer'
import { findUserByEmail, updateUserPassword, revokeUserTokens } from '../utils'
import { escapeHtml } from '../utils/escape-html'
import { issueEmailToken, consumeEmailToken, EMAIL_TOKEN_TTL_HOURS } from '../utils/email-token'
import type { ModuleOptions } from 'nuxt-users/utils'

const TOKEN_EXPIRATION_HOURS = EMAIL_TOKEN_TTL_HOURS.password_reset

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

  // A deactivated or unconfirmed user cannot log in, so a reset would only reopen their account.
  // They get the same silent response as an unknown email.
  if (!user.active) {
    console.log(`[Nuxt Users] Password reset requested for inactive user: ${email}`)
    return
  }

  const token = await issueEmailToken(email, 'password_reset', options)

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
  const safeLink = escapeHtml(resetLink)

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
            <a href="${safeLink}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>Or copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
            <a href="${safeLink}">${safeLink}</a>
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
  if (!await consumeEmailToken(email, token, 'password_reset', options)) {
    return false
  }

  // Update user's password
  await updateUserPassword(email, newPassword, options)

  // Log out every existing session: whoever had access before the reset must not keep it
  const user = await findUserByEmail(email, options)
  if (user) {
    await revokeUserTokens(user.id, options)
  }

  console.log(`[Nuxt Users] Password reset successful for email: ${email}`)
  return true
}
