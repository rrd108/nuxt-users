# Password Reset

Learn how to implement password reset functionality in your Nuxt application using the Nuxt Users module.

## Overview

The module provides a complete password reset flow with:

- Email-based password reset requests
- Secure token-based validation
- Time-limited reset tokens (1 hour expiration)
- Ready-to-use Vue components
- Professional email templates

## How It Works

1. **User requests reset** - User enters their email on a forgot password page
2. **Email sent** - A secure reset link is sent to the user's email
3. **User clicks link** - The reset link contains a secure token and email parameters
4. **Password updated** - User sets a new password using the provided form
5. **Automatic cleanup** - Used tokens are automatically deleted

## Reset URL Format

Password reset emails include a complete URL with the necessary parameters:

```
https://yourapp.com/reset-password?token=abc123...&email=user@example.com
```

Your reset password page should read these query parameters to populate the reset form.

## Reset URL Configuration

The module automatically constructs password reset URLs using your application's base URL and the configured path.

### Default Behavior

By default, reset links use `/reset-password` as the path:

```
https://yourapp.com/reset-password?token=abc123...&email=user@example.com
```

### Custom Reset URL Path

You can customize the path portion of the reset URL:

```ts
nuxtUsers: {
  passwordResetUrl: '/auth/reset-password', // Custom path
}
```

This will generate reset links like:

```
https://yourapp.com/auth/reset-password?token=abc123...&email=user@example.com
```

### Zero Configuration

The module automatically detects your application's base URL from the incoming request, so you don't need to configure a full base URL. The system intelligently combines:

- **Request host**: Automatically detected from headers
- **Protocol**: Detected from `x-forwarded-proto` header or defaults to `http`
- **Reset path**: Your configured `passwordResetUrl` (default: `/reset-password`)

### Development vs Production

**Development** (automatic detection):
- Request to `http://localhost:3000` → Reset URL: `http://localhost:3000/reset-password`

**Production** (automatic detection):
- Request to `https://myapp.com` → Reset URL: `https://myapp.com/reset-password`

No manual configuration of base URLs required!

## Configuration

Configure the mailer in your `nuxt.config.ts`:

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
    passwordResetUrl: '/reset-password', // URL path for password reset page
  }
})
```

### Development Setup with Ethereal Email

For testing during development, you can use Ethereal Email:

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
  passwordResetUrl: '/reset-password', // Custom URL path (optional)
}
```

## Using the Reset Password Component

### NUsersResetPasswordForm

The simplest way to implement password reset is creating a new page called `reset-password.vue` and using the `NUsersResetPasswordForm` component:

```vue
<template>
  <div>
    <h1>Reset Your Password</h1>
    <NUsersResetPasswordForm />
  </div>
</template>
```

This component automatically:
- Reads `token` and `email` from URL query parameters
- Provides password and confirmation fields
- Handles form validation
- Makes the API call to reset the password
- Redirects to login page upon success

## Custom Implementation

### Creating a Forgot Password Form

```vue
<template>
  <form @submit.prevent="requestReset">
    <div>
      <label for="email">Email Address</label>
      <input 
        id="email"
        v-model="email" 
        type="email" 
        required 
        placeholder="Enter your email"
      />
    </div>
    
    <button type="submit" :disabled="loading">
      {{ loading ? 'Sending...' : 'Send Reset Link' }}
    </button>
    
    <div v-if="message" class="success">{{ message }}</div>
    <div v-if="error" class="error">{{ error }}</div>
  </form>
</template>

<script setup>
const email = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')

const requestReset = async () => {
  loading.value = true
  error.value = ''
  message.value = ''
  
  try {
    await $fetch('/api/nuxt-users/password/forgot', {
      method: 'POST',
      body: { email: email.value }
    })
    
    message.value = 'Password reset link sent to your email'
    email.value = ''
    
  } catch (err) {
    error.value = 'Failed to send reset link. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
```

### Creating a Custom Reset Password Form

```vue
<template>
  <form @submit.prevent="resetPassword">
    <div>
      <label for="password">New Password</label>
      <input 
        id="password"
        v-model="password" 
        type="password" 
        required 
        minlength="8"
        placeholder="Enter new password"
      />
    </div>
    
    <div>
      <label for="passwordConfirmation">Confirm Password</label>
      <input 
        id="passwordConfirmation"
        v-model="passwordConfirmation" 
        type="password" 
        required 
        placeholder="Confirm new password"
      />
    </div>
    
    <button type="submit" :disabled="loading">
      {{ loading ? 'Resetting...' : 'Reset Password' }}
    </button>
    
    <div v-if="error" class="error">{{ error }}</div>
  </form>
</template>

<script setup>
const route = useRoute()
const router = useRouter()

const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const error = ref('')

// Get token and email from URL parameters
const token = route.query.token
const email = route.query.email

const resetPassword = async () => {
  if (password.value !== passwordConfirmation.value) {
    error.value = 'Passwords do not match'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    await $fetch('/api/nuxt-users/password/reset', {
      method: 'POST',
      body: {
        token,
        email,
        password: password.value,
        password_confirmation: passwordConfirmation.value
      }
    })
    
    // Redirect to login page
    await router.push('/login')
    
  } catch (err) {
    error.value = 'Password reset failed. The link may be expired or invalid.'
  } finally {
    loading.value = false
  }
}
</script>
```

## API Endpoints

### Request Password Reset

**Endpoint:** `POST /api/nuxt-users/password/forgot`

**Request:**
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

**Endpoint:** `POST /api/nuxt-users/password/reset`

**Request:**
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

## Security Features

The password reset system includes several security measures:

- **Secure tokens**: Cryptographically secure random tokens
- **Time-limited**: Tokens expire after 1 hour
- **Single-use**: Tokens are deleted after successful use
- **No user enumeration**: Same response for existing and non-existing emails
- **Professional email templates**: Clear instructions and security warnings

## Email Template

The password reset emails include:

- Clear call-to-action button for easy access
- Fallback URL for copy/paste
- Security warnings about ignoring unwanted emails
- Expiration notice (1 hour by default)
- Both HTML and plain text versions

## Troubleshooting

### Common Issues

**Email not received:**
- Check spam/junk folder
- Verify mailer configuration in `nuxt.config.ts`
- Ensure email credentials are correct

**Token expired:**
- Tokens expire after 1 hour by default
- Request a new reset link

**Invalid token error:**
- Ensure the complete URL from email is used
- Check that token and email parameters are present
- Request a new reset link if the current one is corrupted

**Password validation errors:**
- Ensure passwords match
- Check minimum password requirements
- Verify password confirmation field

### Testing the Flow

1. Create a test user account
2. Visit your forgot password page
3. Enter the test email address
4. Check email for the reset link
5. Click the link and set a new password
6. Verify you can log in with the new password

## Next Steps

- [Authentication Guide](/user-guide/authentication) - Learn about the authentication system
- [Components Guide](/user-guide/components) - Explore all available Vue components
- [Configuration Guide](/user-guide/configuration) - View all configuration options