# Password Reset

Learn how to implement password reset functionality in your Nuxt Users application.

## Overview

The module includes a complete password reset flow with:

- Email-based password reset
- Secure token generation and validation
- Time-limited reset tokens
- Ready-to-use Vue components

## Flow Overview

1. **User requests reset** - User enters email on forgot password page
2. **Token generation** - Secure token is generated and hashed
3. **Email sending** - Complete reset link with token and email is sent to user's email
4. **Token validation** - User clicks link and token is validated
5. **Password update** - New password is hashed and stored
6. **Token cleanup** - Used tokens are deleted

## Reset URL Format

The password reset emails now include a complete URL with the token and email parameters:

```
https://yourapp.com/reset-password?token=abc123...&email=user@example.com
```

Your reset password page should read these query parameters to populate the reset form.

## Configuration

### Mailer Setup

First, configure the mailer in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    connector: {
      name: 'sqlite',
      options: {
        path: './data/default.sqlite3'
      }
    },
    mailer: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password',
      },
      defaults: {
        from: '"Your App" <noreply@yourapp.com>',
      },
    },
    passwordResetBaseUrl: 'https://yourapp.com', // Base URL for reset links
  }
})
```

### Testing with Ethereal Email

For development, you can use Ethereal Email:

```ts
nuxtUsers: {
  // ... other options
  mailer: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'your-ethereal-user@ethereal.email',
      pass: 'your-ethereal-password',
    },
    defaults: {
      from: '"My Nuxt App" <noreply@example.com>',
    },
  },
  passwordResetBaseUrl: 'http://localhost:3000',
}
```

## Components

### ResetPasswordForm

This component provides a form for users to set a new password using a token from the reset link.

```vue
<template>
  <ResetPasswordForm />
</template>
```

The component:
- Automatically reads `token` and `email` from URL query parameters
- Handles API calls to `/api/auth/reset-password`
- Validates password confirmation
- Redirects to login upon success

## API Endpoints

### Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset link sent to your email"
}
```

### Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "email": "user@example.com",
  "password": "new-password",
  "password_confirmation": "new-password"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

## Custom Implementation

### Manual Forgot Password

```vue
<script setup>
const requestReset = async (email) => {
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email }
    })
    
    // Show success message
    console.log('Reset link sent')
    
  } catch (error) {
    // Handle error
    console.error('Failed to send reset link:', error)
  }
}
</script>
```

### Manual Reset Password

```vue
<script setup>
const resetPassword = async (token, email, password, passwordConfirmation) => {
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation
      }
    })
    
    // Redirect to login
    await navigateTo('/login')
    
  } catch (error) {
    // Handle error
    console.error('Password reset failed:', error)
  }
}
</script>
```

## Security Features

### Token Security

- **Cryptographically secure**: Tokens are generated using `crypto.randomBytes(32)`
- **Hashed storage**: Tokens are hashed with bcrypt before storing
- **Time-limited**: Tokens expire after 1 hour by default
- **Single-use**: Tokens are deleted after use

### Email Security

- **No enumeration**: Same response for existing/non-existing emails
- **Secure transport**: Uses SMTP with authentication
- **Rate limiting**: Consider implementing rate limiting

## Customization

### Email Template

The password reset emails now include a professional template with:

- **Clear call-to-action button** for easy clicking
- **Fallback URL** for copy/paste
- **Security warnings** about ignoring unwanted emails
- **Expiration notice** (1 hour by default)

The email includes both HTML and plain text versions for maximum compatibility.

### Custom Email Templates

To customize the email appearance, you can modify the email template in `src/runtime/server/services/password.ts`. The current template includes:

```ts
// Construct the complete password reset URL with token and email
const resetUrl = new URL('/reset-password', options.passwordResetBaseUrl || 'http://localhost:3000')
resetUrl.searchParams.set('token', token)
resetUrl.searchParams.set('email', email)

const resetLink = resetUrl.toString()
```

The reset link now properly includes both the token and email as query parameters.

### Custom Token Expiration

Modify the token expiration time:

```ts
// In src/runtime/server/services/password.ts
const TOKEN_EXPIRATION_HOURS = 2 // Change from 1 to 2 hours
```

## Troubleshooting

### Common Issues

1. **Email not sent**: Check mailer configuration and credentials
2. **Token expired**: Tokens expire after 1 hour by default
3. **Invalid token**: Ensure the token from email matches exactly
4. **Email not found**: Check if the email exists in the database

### Testing

```bash
# Create a test user
npx nuxt-users create-user test@example.com "Test User" password123

# Test the reset flow
# 1. Visit /forgot-password
# 2. Enter test@example.com
# 3. Check email for reset link
# 4. Click link and set new password
```

## Next Steps

- [Authentication](/guide/authentication) - Learn about the authentication system
- [Components](/components/) - Explore available Vue components
- [API Reference](/api/) - View all API endpoints 