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

Upon successful login via the `/api/login` endpoint:

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
- **Token expiration**: Tokens can have expiration times
- **Last used tracking**: Monitor token usage

## Login API

### Endpoint

`POST /api/login`

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
    const response = await $fetch('/api/login', {
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

You can implement custom logout logic using the `useAuth` composable:

```vue
<script setup>
const { logout } = useAuth()

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
    await $fetch('/api/logout', {
      method: 'GET'
    })
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

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS in production
2. **Secure cookies**: HTTP-only, secure, same-site cookies
3. **Token expiration**: Set reasonable expiration times
4. **Rate limiting**: Implement rate limiting on login endpoints
5. **Password requirements**: Enforce strong password policies
6. **Input validation**: Validate all user inputs

## Next Steps

- [Password Reset](/guide/password-reset) - Add password reset functionality
- [Components](/components/) - Learn about available Vue components
- [API Reference](/api/) - Explore all available API endpoints 