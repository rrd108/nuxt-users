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
      whitelist: ['/register'], // /confirm-email is automatically added when /register is present
    },
  },
})
```

**Note:** When you add `/register` to the whitelist, the module automatically adds `/confirm-email` as well, since users need to access email confirmation links without authentication.

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
const handleSuccess = (user, rememberMe) => {
  console.log('Login successful:', user, 'Remember me:', rememberMe)
  // The login composable will automatically handle the rememberMe setting
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

For detailed usage of the `useAuthentication` composable, refer to the [Composables documentation](/user-guide/composables.md#useauthentication).

## User Registration

The module provides a complete user registration system with email confirmation to ensure valid email addresses and prevent spam accounts.

### Registration Flow

1. **User submits registration form** - Email, name, and password are validated
2. **Password strength validation** - Ensures password meets security requirements
3. **User account created** - Account is created in inactive state
4. **Confirmation email sent** - User receives email with secure confirmation link
5. **User clicks confirmation link** - Account is activated and ready for login

### Using the NUsersRegisterForm Component

The module provides a ready-to-use `NUsersRegisterForm` component:

```vue
<template>
  <NUsersRegisterForm 
    @success="handleRegistrationSuccess"
    @error="handleRegistrationError"
  />
</template>

<script setup>
const handleRegistrationSuccess = (data) => {
  console.log('Registration successful:', data.user)
  console.log('Message:', data.message)
  // Show success message to user
}

const handleRegistrationError = (error) => {
  console.log('Registration failed:', error)
  // Show error message to user
}
</script>
```

### Configuration Requirements

To enable registration, you need to:

1. **Whitelist the registration route** in your `nuxt.config.ts`
2. **Configure email settings** for sending confirmation emails

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    auth: {
      whitelist: ['/register'], // Also auto-whitelists /confirm-email
    },
    // Email configuration for confirmation emails
    mailer: {
      host: 'smtp.your-provider.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'your-email@example.com',
        pass: 'your-password'
      },
      defaults: {
        from: '"Your App" <noreply@yourapp.com>'
      }
    },
    // Configure password requirements
    passwordValidation: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true
    }
  }
})
```

### Registration API

**Endpoint:** `POST /api/nuxt-users/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123!"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Registration successful! Please check your email to confirm your account."
}
```

### Email Confirmation

**Endpoint:** `GET /api/nuxt-users/confirm-email`

**Query Parameters:**
- `token`: Email confirmation token from the registration email
- `email`: User's email address

**Example:**
```
GET /api/nuxt-users/confirm-email?token=abc123def456&email=user@example.com
```

### Security Features

- **Email verification required**: Prevents fake email registrations
- **Inactive accounts**: New accounts remain inactive until email confirmation
- **Secure tokens**: Confirmation tokens are hashed and expire after 24 hours
- **Password strength validation**: Enforces strong password requirements
- **Duplicate prevention**: Prevents registration with existing email addresses

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

For manual logout using the `useAuthentication` composable, refer to the [Composables documentation](/user-guide/composables.md#useauthentication).

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
      tokenExpiration: 1440, // 24 hours in minutes (for regular sessions)
      rememberMeExpiration: 30, // 30 days (for "remember me" sessions)
    }
  }
})
```

### Remember Me Functionality

The module provides secure "remember me" functionality that:

- **Regular login** (remember me unchecked):
  - Sets session-only HTTP cookies that expire when browser closes
  - Stores user data in `sessionStorage` (cleared when tab closes)
  - Uses `tokenExpiration` setting (default: 24 hours)

- **Remember me login** (remember me checked):
  - Sets persistent HTTP cookies with longer expiration
  - Stores user data in `localStorage` for persistence across browser sessions  
  - Uses `rememberMeExpiration` setting (default: 30 days)

The module automatically handles:
- Token expiration validation
- Automatic token cleanup
- Token refresh on activity
- **Hard reload persistence**: Users remain logged in after hard refresh (Ctrl+F5)

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

## Server-Side Authentication

### Using getCurrentUser() in API Routes

For server-side authentication in your API routes, use the `getCurrentUser()` function from the server-side `useServerAuth()` composable. This is essential for protecting API endpoints and accessing user data in server contexts.

```typescript
// server/api/profile.get.ts
import { useServerAuth } from '#nuxt-users/server'

export default defineEventHandler(async (event) => {
  const { getCurrentUser } = useServerAuth()
  const user = await getCurrentUser(event)
  
  if (!user) {
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Authentication required' 
    })
  }
  
  return {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.last_login_at
    }
  }
})
```

### Role-Based API Protection

```typescript
// server/api/admin/users.get.ts
import { useServerAuth } from '#nuxt-users/server'

export default defineEventHandler(async (event) => {
  const { getCurrentUser } = useServerAuth()
  const user = await getCurrentUser(event)
  
  // Check authentication
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  
  // Check authorization
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }
  
  // Admin-only logic here
  const allUsers = await fetchAllUsers()
  return { users: allUsers }
})
```

### User-Specific Data Access

```typescript
// server/api/posts/my-posts.get.ts
import { useServerAuth } from '#nuxt-users/server'

export default defineEventHandler(async (event) => {
  const { getCurrentUser } = useServerAuth()
  const user = await getCurrentUser(event)
  
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  
  // Fetch posts belonging to the current user
  const userPosts = await fetchPostsByUserId(user.id)
  return { posts: userPosts }
})
```

### Optional Authentication

Some endpoints may provide different data based on authentication status:

```typescript
// server/api/posts/public.get.ts
import { useServerAuth } from '#nuxt-users/server'

export default defineEventHandler(async (event) => {
  const { getCurrentUser } = useServerAuth()
  const user = await getCurrentUser(event) // Returns null if not authenticated
  
  const posts = await fetchPublicPosts()
  
  // Add extra data for authenticated users
  if (user) {
    const postsWithUserData = posts.map(post => ({
      ...post,
      isLiked: await checkIfUserLikedPost(user.id, post.id),
      canEdit: post.author_id === user.id || user.role === 'admin'
    }))
    return { posts: postsWithUserData }
  }
  
  // Return basic data for non-authenticated users
  return { posts }
})
```

### Database Operations with User Context

```typescript
// server/api/comments.post.ts
import { useServerAuth } from '#nuxt-users/server'
import { readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const { getCurrentUser } = useServerAuth()
  const user = await getCurrentUser(event)
  
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  
  const { postId, content } = await readBody(event)
  
  // Create comment with authenticated user's ID
  const newComment = await createComment({
    post_id: postId,
    author_id: user.id, // Use authenticated user's ID
    content,
    created_at: new Date()
  })
  
  return { comment: newComment }
})
```

### Middleware Pattern

Create reusable authentication middleware:

```typescript
// server/utils/authMiddleware.ts
import { useServerAuth } from '#nuxt-users/server'
import type { UserWithoutPassword } from 'nuxt-users/utils'

export const requireAuth = async (event: any): Promise<UserWithoutPassword> => {
  const { getCurrentUser } = useServerAuth()
  const user = await getCurrentUser(event)
  
  if (!user) {
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Authentication required' 
    })
  }
  
  return user
}

export const requireRole = async (event: any, requiredRole: string): Promise<UserWithoutPassword> => {
  const user = await requireAuth(event)
  
  if (user.role !== requiredRole) {
    throw createError({ 
      statusCode: 403, 
      statusMessage: `${requiredRole} access required` 
    })
  }
  
  return user
}
```

Then use the middleware in your API routes:

```typescript
// server/api/admin/dashboard.get.ts
import { requireRole } from '~/server/utils/authMiddleware'

export default defineEventHandler(async (event) => {
  const adminUser = await requireRole(event, 'admin')
  
  // Admin-only logic here
  return { 
    message: `Welcome admin ${adminUser.name}!`,
    stats: await getAdminStats() 
  }
})
```

## Checking Authentication Status

For checking authentication status using the `useAuthentication` composable, refer to the [Composables documentation](/user-guide/composables.md#useauthentication).

For accessing the current user in client-side components, see the [`getCurrentUser()` documentation](/user-guide/composables.md#getcurrentuser).

## Error Handling

For error handling with the `useAuthentication` composable, refer to the [Composables documentation](/user-guide/composables.md#useauthentication).

## Google OAuth Authentication

The module provides built-in support for Google OAuth authentication, allowing users to register and login using their Google accounts.

### Google Cloud Setup

Before implementing Google OAuth, you need to set up a project in Google Cloud Console:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google+ API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" or "People API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add your callback URL: `https://yourdomain.com/api/nuxt-users/auth/google/callback`
   - Save your Client ID and Client Secret

### Configuration

Add Google OAuth configuration to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    auth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        // Optional: customize URLs and scopes
        callbackUrl: '/api/nuxt-users/auth/google/callback',
        successRedirect: '/dashboard',
        errorRedirect: '/login?error=oauth_failed',
        scopes: ['openid', 'profile', 'email']
      }
    }
  }
})
```

### Environment Variables

Add your Google OAuth credentials to your environment variables:

```bash
# .env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### Database Migration

For existing databases, run the migration to add Google OAuth fields:

```bash
# Add google_id and profile_picture columns to users table
npx nuxt-users add-google-oauth-fields
```

For new installations, the fields are automatically included when creating the users table.

### Using the Google Login Button

The module provides a ready-to-use `NUsersGoogleLoginButton` component:

```vue
<template>
  <div class="login-page">
    <h1>Sign In</h1>
    
    <!-- Traditional login form -->
    <NUsersLoginForm @success="handleLoginSuccess" />
    
    <!-- Divider -->
    <div class="divider">
      <span>or</span>
    </div>
    
    <!-- Google OAuth button -->
    <NUsersGoogleLoginButton 
      @click="handleGoogleLogin"
      button-text="Sign in with Google"
      class="google-login-btn"
    />
  </div>
</template>

<script setup>
const handleLoginSuccess = (user) => {
  console.log('Login successful:', user)
  await navigateTo('/dashboard')
}

const handleGoogleLogin = () => {
  console.log('Starting Google OAuth flow')
}
</script>
```

### Component Props

The `NUsersGoogleLoginButton` component accepts these props:

- **`buttonText`** (string): Button text (default: "Continue with Google")
- **`showLogo`** (boolean): Show Google logo (default: true)
- **`redirectEndpoint`** (string): Custom OAuth redirect endpoint
- **`class`** (string): Custom CSS class

### OAuth Flow

The Google OAuth authentication flow works as follows:

1. **User clicks Google login button** → Redirects to `/api/nuxt-users/auth/google/redirect`
2. **Redirect to Google** → User is sent to Google's OAuth consent screen
3. **User grants permission** → Google redirects back to `/api/nuxt-users/auth/google/callback`
4. **Process OAuth response** → Module exchanges code for user info
5. **Create or link account** → User is created or existing account is linked
6. **Set authentication cookie** → User is logged in with persistent session
7. **Redirect to success page** → User is redirected to configured success URL

### User Account Linking

The module intelligently handles user account linking:

- **New Google user**: Creates a new account with secure random password
- **Existing email**: Links Google account to existing user account  
- **Returning Google user**: Logs in existing user and updates profile picture

### Security Features

- **Secure password generation**: OAuth users get cryptographically secure random passwords
- **Email verification**: Only verified Google emails are accepted
- **Account activation**: Inactive accounts are blocked from OAuth login
- **Profile picture sync**: User profile pictures are automatically updated
- **Token management**: Uses the same secure token system as password authentication

### Error Handling

The OAuth flow handles various error scenarios:

- **OAuth denied**: User cancels Google consent → redirects to error page
- **Invalid configuration**: Missing client ID/secret → shows configuration error
- **Account inactive**: Inactive user attempts login → redirects with error message
- **API errors**: Google API failures → logs error and redirects safely

### Customization

You can customize the OAuth behavior:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nuxtUsers: {
    auth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        
        // Customize redirect URLs
        successRedirect: '/welcome', // After successful login
        errorRedirect: '/login?error=google_failed', // After failed login
        
        // Request additional permissions
        scopes: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/user.birthday.read'],
        
        // Custom callback URL (must match Google Cloud Console)
        callbackUrl: '/api/nuxt-users/auth/google/callback'
      }
    }
  }
})
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
10. **OAuth security**: Keep your Google Client Secret secure and never expose it to the client

## Next Steps

- [Authorization (RBAC)](/user-guide/authorization) - Learn about Role-Based Access Control
- [Password Reset](/user-guide/password-reset) - Add password reset functionality
- [Components](/user-guide/components) - Learn about available Vue components
- [Configuration](/user-guide/configuration) - Explore all configuration options