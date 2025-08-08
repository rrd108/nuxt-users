# Authentication

Learn how the authentication system works in Nuxt Users.

## Overview

The module provides a complete authentication system with:

- Secure login with bcrypt password hashing
- Token-based authentication (inspired by Laravel Sanctum)
- HTTP-only cookies for security
- Automatic token management

## Whitelisting Routes

By default, all pages (except `/login`) require authentication. You can whitelist routes that should be accessible without authentication using the `auth.whitelist` option in your `nuxt.config.ts`.

If you want to add other pages what can be accessed without authentication, like a `/register` page, you can do so like this:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    auth: {
      whitelist: ['/login', '/register'],
    },
  },
})
```

## Authentication Flow

Upon successful login via the `/api/nuxt-users/session` endpoint:

1. **User submits credentials** - Email and password are sent to the server
2. **Password verification** - bcrypt compares the password with the stored hash
3. **Token generation** - A secure, random token is generated using crypto
4. **Token storage** - Token is stored in the `personal_access_tokens` table
5. **Cookie setting** - An HTTP-only cookie named `auth_token` is set in the browser
6. **Response** - User data is returned to the client

## Token-Based Authentication

The system uses token-based authentication similar to Laravel Sanctum:

### Token Storage

Tokens are stored in the `personal_access_tokens` table with the following structure:

```sql
CREATE TABLE personal_access_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tokenable_type TEXT NOT NULL,      -- 'user'
  tokenable_id INTEGER NOT NULL,     -- user.id
  name TEXT NOT NULL,                -- 'auth_token'
  token TEXT NOT NULL UNIQUE,        -- The actual token
  abilities TEXT,                    -- Token permissions
  last_used_at DATETIME,            -- Last usage timestamp
  expires_at DATETIME,              -- Expiration timestamp
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Security Features

- **Cryptographically secure**: Tokens are generated using `crypto.randomBytes(64)`
- **HTTP-only cookies**: Prevents XSS attacks
- **Automatic expiration**: Tokens expire based on `auth.tokenExpiration` setting (default: 24 hours)
- **Expired token cleanup**: Automatic cleanup of expired tokens during authentication
- **Last used tracking**: Monitor token usage with automatic timestamp updates
- **Token revocation**: Ability to revoke all tokens for a user

## Login API

### Endpoint

`POST /api/nuxt-users/session`

### Request Body

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Responses

```json
// 400 Bad Request
{
  "statusMessage": "Email and password are required"
}

// 401 Unauthorized
{
  "statusMessage": "Invalid email or password"
}
```

## Using the LoginForm Component

The module provides a ready-to-use `LoginForm` component:

```vue
<template>
  <LoginForm 
    @success="handleSuccess"
    @error="handleError"
  />
</template>

<script setup>
const handleSuccess = (user) => {
  console.log('Login successful:', user)
  // Redirect or update UI
}

const handleError = (error) => {
  console.log('Login error:', error)
  // Show error message
}
</script>
```

## Custom Authentication

### Manual Login

You can implement custom login logic:

```vue
<script setup>
const login = async (email, password) => {
  try {
    const response = await $fetch('/api/nuxt-users/session', {
      method: 'POST',
      body: { email, password }
    })
    
    // Handle successful login
    console.log('User:', response.user)
    
  } catch (error) {
    // Handle error
    console.error('Login failed:', error)
  }
}
</script>
```

### Token Validation

To validate tokens on the server side:

```ts
// In your API route
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
  
  // Validate token against database
  // Return user data if valid
})
```

## Logout

The module provides a complete logout system that securely removes authentication tokens and clears user sessions.

### Using the LogoutLink Component

The module provides a ready-to-use `LogoutLink` component:

```vue
<template>
  <LogoutLink 
    @success="handleSuccess"
    @error="handleError"
  />
</template>

<script setup>
const handleSuccess = () => {
  console.log('Logout successful')
  // Handle successful logout
}

const handleError = (error) => {
  console.log('Logout error:', error)
  // Show error message
}
</script>
```

### Customizing the LogoutLink

You can customize the appearance and behavior:

```vue
<LogoutLink 
  link-text="Sign Out"
  redirect-to="/home"
  confirm-message="Are you sure you want to sign out?"
  class="custom-logout-link"
/>
```

### Manual Logout

You can implement custom logout logic using the `useAuthentication` composable:

```vue
<script setup>
const { logout } = useAuthentication()

const handleLogout = async () => {
  try {
    await logout()
    console.log('Logged out successfully')
    // Redirect or update UI
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>
```

### Direct API Call

You can also call the logout API directly:

```vue
<script setup>
const logout = async () => {
  try {
    await $fetch('/api/nuxt-users/session', { method: 'DELETE' })
    console.log('Logged out successfully')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>
```

### Logout Process

When a user logs out:

1. **Token deletion**: The authentication token is removed from the database
2. **Cookie clearing**: The `auth_token` cookie is cleared from the browser
3. **State cleanup**: The user state is cleared from the application
4. **Redirect**: User is optionally redirected to a specified page

## Token Management

### Configuring Token Expiration

Set token expiration time in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    auth: {
      tokenExpiration: 1440, // 24 hours in minutes
    }
  }
})
```

### Token Cleanup

The module automatically:
- Rejects expired tokens during authentication
- Updates `last_used_at` timestamp for active tokens
- Provides utility functions for token management

### Manual Token Management

#### Using Nitro Tasks (Recommended)

The module provides a Nitro task for comprehensive token cleanup:

```bash
# Clean up both expired tokens and tokens without expiration
npx nuxi task run nuxt-users:cleanup-tokens

# Clean up only expired tokens (keep tokens without expiration)
npx nuxi task run nuxt-users:cleanup-tokens --payload '{"includeNoExpiration":false}'
```

You can also run this task programmatically:

```ts
// In your server code
const result = await runTask('nuxt-users:cleanup-tokens', {
  includeNoExpiration: true // optional, defaults to true
})

console.log(`Cleaned up ${result.totalTokensCleaned} tokens`)
```

#### Scheduling Token Cleanup

For production applications, you can schedule regular token cleanup using Nitro's scheduled tasks. Add the scheduled tasks to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nitro: {
    scheduledTasks: {
      // Run token cleanup daily at 2 AM
      '0 2 * * *': ['nuxt-users:cleanup-tokens']
    }
  }
})
```

You can also schedule with custom payloads:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nitro: {
    scheduledTasks: {
      // Clean up expired tokens every 6 hours
      '0 */6 * * *': [['nuxt-users:cleanup-tokens', { includeNoExpiration: false }]],
      // Full cleanup (including tokens without expiration) once daily
      '0 2 * * *': [['nuxt-users:cleanup-tokens', { includeNoExpiration: true }]]
    }
  }
})
```

#### Using Utility Functions

For advanced use cases, you can use the utility functions directly:

```ts
import { 
  deleteExpiredPersonalAccessTokens, 
  deleteTokensWithoutExpiration,
  cleanupPersonalAccessTokens,
  revokeUserTokens 
} from 'nuxt-users/server/utils'

// Clean up expired tokens only
const expiredCount = await deleteExpiredPersonalAccessTokens(options)

// Clean up tokens without expiration
const noExpirationCount = await deleteTokensWithoutExpiration(options)

// Comprehensive cleanup (both expired and no expiration)
const result = await cleanupPersonalAccessTokens(options, true)

// Revoke all tokens for a specific user
await revokeUserTokens(userId, options)
```

## Security Enhancements

### Rate Limiting (Recommended)

For production deployments, we strongly recommend using [nuxt-api-shield](https://github.com/rrd108/nuxt-api-shield) to protect authentication endpoints from brute force attacks:

```bash
# Install the rate limiting module
npx nuxi module add
```

Configure rate limiting in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users', 'nuxt-api-shield'],
  
  nuxtUsers: {
    // ... your nuxt-users config
  },
  
  apiShield: {
    maxRequests: 5,        // 5 login attempts per duration
    duration: 60000,       // 1 minute window
    banDuration: 300000,   // 5 minute ban for violators
    delay: 1000,           // 1 second delay on banned IPs
    routes: [
      '/api/nuxt-users/session',           // Protect login endpoint
      '/api/nuxt-users/password/forgot',   // Protect password reset requests  
      '/api/nuxt-users/password/reset'     // Protect password reset completion
    ],
    log: true // Enable logging for monitoring
  }
})
```

This configuration provides:
- **Brute force protection**: Limits login attempts per IP
- **Automatic IP banning**: Temporarily blocks malicious IPs
- **Password reset protection**: Prevents abuse of reset functionality
- **Configurable thresholds**: Adjustable for your security needs
- **Monitoring**: Logs for security analysis

### Advanced Rate Limiting

For different security levels on different endpoints:

```ts
apiShield: {
  routes: {
    '/api/nuxt-users/session': {
      maxRequests: 5,      // Stricter limit for login
      duration: 60000,     // 1 minute
      banDuration: 600000  // 10 minute ban
    },
    '/api/nuxt-users/password/forgot': {
      maxRequests: 3,      // Very strict for password reset
      duration: 300000,    // 5 minute window
      banDuration: 1800000 // 30 minute ban
    }
  }
}
```

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS in production
2. **Secure cookies**: HTTP-only, secure, same-site cookies
3. **Token expiration**: Set reasonable expiration times (default: 24 hours)
4. **Regular cleanup**: Use the `nuxt-users:cleanup-tokens` task to periodically clean expired tokens
5. **Rate limiting**: Use nuxt-api-shield to protect authentication endpoints
6. **Password requirements**: Enforce strong password policies
7. **Input validation**: Validate all user inputs
8. **Token revocation**: Revoke tokens on suspicious activity
9. **Monitoring**: Log authentication attempts and failures
10. **Security headers**: Implement proper security headers

## Next Steps

- [Authorization (RBAC)](/guide/authorization) - Learn about Role-Based Access Control
- [Password Reset](/guide/password-reset) - Add password reset functionality
- [Components](/components/) - Learn about available Vue components
- [API Reference](/api/) - Explore all available API endpoints 