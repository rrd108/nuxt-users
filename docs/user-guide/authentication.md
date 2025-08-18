# Authentication

Learn how to implement authentication in your Nuxt application using Nuxt Users.

## Overview

The module provides a complete authentication system with:

- Secure login with bcrypt password hashing
- Token-based authentication (inspired by Laravel Sanctum)
- HTTP-only cookies for security
- Automatic token management

## Whitelisting Routes

By default, all pages (except `/login`) require authentication. You can whitelist routes that should be accessible without authentication using the `auth.whitelist` option in your `nuxt.config.ts`.

If you want to add other pages that can be accessed without authentication, like a `/register` page, you can do so like this:

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

Upon successful login:

1. **User submits credentials** - Email and password are sent to the server
2. **Password verification** - The server verifies the password securely
3. **Token generation** - A secure authentication token is created
4. **Cookie setting** - An HTTP-only cookie is set in the browser
5. **Response** - User data is returned to your application

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

## Using the NUsersLoginForm Component

The module provides a ready-to-use `NUsersLoginForm` component:

```vue
<template>
  <NUsersLoginForm 
    @success="handleSuccess"
    @error="handleError"
  />
</template>

<script setup>
const handleSuccess = (user) => {
  console.log('Login successful:', user)
  // Redirect or update UI
  await navigateTo('/dashboard')
}

const handleError = (error) => {
  console.log('Login error:', error)
  // Show error message to user
}
</script>
```

## Custom Authentication

### Manual Login

You can implement custom login logic:

```vue
<template>
  <form @submit.prevent="handleLogin">
    <input v-model="email" type="email" placeholder="Email" required />
    <input v-model="password" type="password" placeholder="Password" required />
    <button type="submit" :disabled="loading">
      {{ loading ? 'Logging in...' : 'Login' }}
    </button>
  </form>
</template>

<script setup>
const email = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  
  try {
    const response = await $fetch('/api/nuxt-users/session', {
      method: 'POST',
      body: { 
        email: email.value, 
        password: password.value 
      }
    })
    
    // Handle successful login
    console.log('User:', response.user)
    await navigateTo('/dashboard')
    
  } catch (error) {
    // Handle error
    console.error('Login failed:', error)
    // Show error message to user
  } finally {
    loading.value = false
  }
}
</script>
```

### Using the Authentication Composable

The module provides a `useAuthentication` composable for easier authentication management:

```vue
<script setup>
const { login, user, isAuthenticated } = useAuthentication()

const handleLogin = async (email, password) => {
  try {
    await login(email, password)
    console.log('Login successful:', user.value)
    await navigateTo('/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
  }
}

// Check if user is authenticated
if (isAuthenticated.value) {
  console.log('User is logged in:', user.value)
}
</script>
```

## Logout

The module provides a complete logout system that securely removes authentication tokens and clears user sessions.

### Using the NUsersLogoutLink Component

The module provides a ready-to-use `NUsersLogoutLink` component:

```vue
<template>
  <NUsersLogoutLink 
    @success="handleSuccess"
    @error="handleError"
  />
</template>

<script setup>
const handleSuccess = () => {
  console.log('Logout successful')
  // Handle successful logout
  await navigateTo('/login')
}

const handleError = (error) => {
  console.log('Logout error:', error)
  // Show error message
}
</script>
```

### Customizing the NUsersLogoutLink

You can customize the appearance and behavior:

```vue
<NUsersLogoutLink 
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
    await navigateTo('/login')
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
    await navigateTo('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>
```

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

The module automatically handles:
- Token expiration validation
- Automatic token cleanup
- Token refresh on activity

## Security Features

### Built-in Security

The authentication system includes several security features:

- **Cryptographically secure tokens**: Tokens are generated using secure random methods
- **HTTP-only cookies**: Prevents XSS attacks by making tokens inaccessible to JavaScript
- **Automatic expiration**: Tokens expire based on your configuration (default: 24 hours)
- **Expired token cleanup**: Automatic cleanup of expired tokens
- **Token revocation**: Ability to revoke all tokens for a user

### Rate Limiting (Recommended)

For production deployments, we strongly recommend using [nuxt-api-shield](https://github.com/rrd108/nuxt-api-shield) to protect authentication endpoints from brute force attacks:

```bash
# Install the rate limiting module
npx nuxi module add nuxt-api-shield
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

## Checking Authentication Status

### In Components

```vue
<template>
  <div>
    <div v-if="isAuthenticated">
      <p>Welcome, {{ user.name }}!</p>
      <NUsersLogoutLink />
    </div>
    <div v-else>
      <p>Please log in to continue</p>
      <NUsersLoginForm @success="handleLoginSuccess" />
    </div>
  </div>
</template>

<script setup>
const { user, isAuthenticated } = useAuthentication()

const handleLoginSuccess = (userData) => {
  console.log('User logged in:', userData)
  // Handle post-login logic
}
</script>
```

### In Pages with Middleware

You can protect pages using the built-in authorization middleware:

```vue
<!-- pages/dashboard.vue -->
<template>
  <div>
    <h1>Dashboard</h1>
    <p>Welcome, {{ user.name }}!</p>
  </div>
</template>

<script setup>
// This page will automatically redirect to login if user is not authenticated
definePageMeta({
  middleware: 'authorization'
})

const { user } = useAuthentication()
</script>
```

## Error Handling

### Handling Authentication Errors

```vue
<script setup>
const { login } = useAuthentication()

const handleLogin = async (email, password) => {
  try {
    await login(email, password)
    // Success - user is now authenticated
  } catch (error) {
    // Handle different types of errors
    if (error.statusCode === 401) {
      console.error('Invalid credentials')
      // Show "Invalid email or password" message
    } else if (error.statusCode === 400) {
      console.error('Missing email or password')
      // Show "Please fill in all fields" message
    } else {
      console.error('Login failed:', error.message)
      // Show generic error message
    }
  }
}
</script>
```

### Network Error Handling

```vue
<script setup>
const handleLogin = async (email, password) => {
  try {
    await login(email, password)
  } catch (error) {
    if (error.name === 'FetchError') {
      console.error('Network error - please check your connection')
      // Show network error message
    } else {
      console.error('Authentication error:', error)
      // Show authentication error message
    }
  }
}
</script>
```

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS in production to protect credentials in transit
2. **Strong passwords**: Enforce strong password policies for your users
3. **Rate limiting**: Use nuxt-api-shield to protect authentication endpoints
4. **Token expiration**: Set reasonable expiration times (default: 24 hours)
5. **Secure storage**: Never store authentication tokens in localStorage or sessionStorage
6. **Input validation**: Validate all user inputs on both client and server
7. **Error messages**: Don't reveal too much information in error messages
8. **Monitoring**: Monitor authentication attempts and failures
9. **Regular updates**: Keep the module and dependencies updated

## Next Steps

- [Authorization (RBAC)](/user-guide/authorization) - Learn about Role-Based Access Control
- [Password Reset](/user-guide/password-reset) - Add password reset functionality
- [Components](/user-guide/components) - Learn about available Vue components
- [Configuration](/user-guide/configuration) - Explore all configuration options