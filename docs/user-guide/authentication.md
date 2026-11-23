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
- **Secure tokens**: Confirmation tokens are hashed, single-use, and expire after 24 hours. They only confirm an email address and cannot be swapped with a password reset token
- **Deactivation voids the link**: Deactivating or deleting a user cancels their outstanding confirmation and password reset links
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
- Token refresh on activity
- **Automatic token cleanup**: Runs daily at 2 AM to remove expired tokens
- **Hard reload persistence**: Users remain logged in after hard refresh (Ctrl+F5)

### Token Cleanup Task

The module automatically schedules token cleanup to run daily at 2 AM. The cleanup task removes expired tokens and optionally tokens without expiration dates. It also removes expired password reset and email confirmation tokens, and expired passkey challenges.

#### Listing Available Tasks

To see all available tasks:

```bash
curl http://localhost:3000/_nitro/tasks/
```

#### Running the Cleanup Task

Run the token cleanup task manually:

```bash
# Clean up expired tokens and tokens without expiration
curl -X POST http://localhost:3000/_nitro/tasks/nuxt-users:cleanup-tokens \
  -H "Content-Type: application/json" \
  -d '{"includeNoExpiration": true}'

# Clean up only expired tokens (keep tokens without expiration)
curl -X POST http://localhost:3000/_nitro/tasks/nuxt-users:cleanup-tokens \
  -H "Content-Type: application/json" \
  -d '{"includeNoExpiration": false}'
```

**Response:**
```json
{
  "result": "success",
  "expiredTokensRemoved": 15,
  "noExpirationTokensRemoved": 3,
  "totalTokensCleaned": 18,
  "emailTokensRemoved": 2,
  "includeNoExpiration": true
}
```

#### Automatic Scheduling

The cleanup task is **automatically scheduled** to run daily at 2 AM by default. You can customize or disable this schedule.

**Configuring the Schedule:**

Set the cleanup schedule using a cron expression in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    // Run cleanup every 6 hours
    tokenCleanupSchedule: '0 */6 * * *',
    
    // Or run cleanup daily at 3 AM instead of 2 AM
    // tokenCleanupSchedule: '0 3 * * *',
    
    // Or disable automatic cleanup (task will still be available manually)
    // tokenCleanupSchedule: false,
  }
})
```

**Cron Expression Examples:**
- `'0 2 * * *'` - Daily at 2 AM (default)
- `'0 */6 * * *'` - Every 6 hours
- `'0 0 * * 0'` - Weekly on Sunday at midnight
- `'0 0 1 * *'` - Monthly on the 1st at midnight
- `false` or `null` - Disable automatic cleanup

**Note:** The task will still be available for manual execution via the Nitro tasks API even if automatic scheduling is disabled.

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
        scopes: ['openid', 'profile', 'email'],
        
        // Control automatic user registration (default: false)
        allowAutoRegistration: false
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
4. **Process OAuth response** → Module exchanges code for user info and verifies email
5. **Find or create user** → Module checks if user exists:
   - Existing Google user → Update profile picture if changed
   - Existing user by email → Link Google account automatically
   - New user + `allowAutoRegistration: true` → Create new account
   - New user + `allowAutoRegistration: false` → Reject with error
6. **Set authentication cookie** → User is logged in with persistent session (30 days by default)
7. **Redirect** → User is redirected to `successRedirect` or `errorRedirect` based on outcome

### User Account Linking & Auto-Registration

The module intelligently handles different user scenarios based on the `allowAutoRegistration` configuration:

#### Scenario 1: Existing User with Google Account
When a user who has previously linked their Google account logs in:
- ✅ User is authenticated immediately
- ✅ Profile picture is automatically updated if changed
- ✅ User is redirected to `successRedirect`

#### Scenario 2: Existing User by Email (Auto-Linking)
When a user with an existing account (created via traditional registration) logs in with Google for the first time:
- ✅ Google account is automatically linked to the existing user account
- ✅ User's `google_id` is saved for future logins
- ✅ Profile picture is added/updated
- ✅ User can now log in with either password or Google

#### Scenario 3: New User (Controlled by `allowAutoRegistration`)

**When `allowAutoRegistration: false` (default - recommended for production)**:
- ❌ New users cannot self-register via Google
- ❌ User is redirected to `errorRedirect` with `error=user_not_registered`
- ✅ More secure for invite-only or controlled access systems
- ✅ Prevents unauthorized account creation

```ts
// Secure configuration - only existing users can log in with Google
auth: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    allowAutoRegistration: false  // Default
  }
}
```

**When `allowAutoRegistration: true` (for public registration)**:
- ✅ New users are automatically registered when they log in with Google
- ✅ Account is created with:
  - Email and name from Google profile
  - Cryptographically secure random password (user won't need it)
  - Profile picture from Google
  - Default role: `'user'`
  - Account status: `active`
- ✅ User is immediately logged in and redirected to `successRedirect`

```ts
// Open registration - anyone with a Google account can register
auth: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    allowAutoRegistration: true  // Allow public registration
  }
}
```

#### Security Considerations

**Use `allowAutoRegistration: false` when:**
- You want to control who can access your application
- You have an invite-only system
- You want admins to manually approve users
- You're building an internal/private application

**Use `allowAutoRegistration: true` when:**
- You want public registration
- You're building a consumer-facing application
- You trust Google's email verification
- You have additional security measures in place (role-based access, etc.)

### Security Features

- **Secure password generation**: OAuth users get cryptographically secure random passwords
- **Email verification**: Only verified Google emails are accepted
- **Account activation**: Inactive accounts are blocked from OAuth login
- **Profile picture sync**: User profile pictures are automatically updated
- **Token management**: Uses the same secure token system as password authentication

### Error Handling

The OAuth flow handles various error scenarios and redirects to `errorRedirect` with specific error codes:

- **`oauth_failed`**: User cancels Google consent or OAuth process fails
- **`oauth_not_configured`**: Missing or invalid Google OAuth configuration (client ID/secret)
- **`user_not_registered`**: New user attempted login when `allowAutoRegistration: false` (default)
- **`account_inactive`**: User account exists but is marked as inactive
- **`oauth_failed`**: Google API failures or token exchange errors

Example error handling in your login page:

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const errorMessage = ref('')

const errorMessages = {
  oauth_failed: 'Google authentication failed. Please try again.',
  user_not_registered: 'You are not registered. Please sign up first or contact an administrator.',
  account_inactive: 'Your account is inactive. Please contact support.',
  oauth_not_configured: 'OAuth is not properly configured. Please contact support.'
}

onMounted(() => {
  const error = route.query.error
  if (error && errorMessages[error]) {
    errorMessage.value = errorMessages[error]
  }
})
</script>

<template>
  <div v-if="errorMessage" class="error-banner">
    {{ errorMessage }}
  </div>
  <NUsersGoogleLoginButton />
</template>
```

### Customization

You can customize the OAuth behavior with all available options:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nuxtUsers: {
    auth: {
      google: {
        // Required: OAuth credentials from Google Cloud Console
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        
        // Control user registration (default: false)
        allowAutoRegistration: false,
        
        // Customize redirect URLs
        successRedirect: '/welcome', // After successful login (default: '/')
        errorRedirect: '/login?error=google_failed', // After failed login
        
        // Request additional permissions (default: ['openid', 'profile', 'email'])
        scopes: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/user.birthday.read'],
        
        // Custom callback URL - must match Google Cloud Console configuration
        callbackUrl: '/api/nuxt-users/auth/google/callback'
      }
    }
  }
})
```

#### Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `clientId` | `string` | **required** | Google OAuth client ID from Google Cloud Console |
| `clientSecret` | `string` | **required** | Google OAuth client secret from Google Cloud Console |
| `allowAutoRegistration` | `boolean` | `false` | Allow new users to auto-register via Google |
| `successRedirect` | `string` | `'/'` | Redirect URL after successful authentication |
| `errorRedirect` | `string` | `'/login?error=oauth_failed'` | Redirect URL after failed authentication |
| `scopes` | `string[]` | `['openid', 'profile', 'email']` | Google OAuth scopes to request |
| `callbackUrl` | `string` | `'/api/nuxt-users/auth/google/callback'` | OAuth callback URL (must match Google Console) |

## Passkey Authentication

Passkeys (WebAuthn) let users sign in with their fingerprint, face, screen lock or a security key instead of a password. Passkeys are an **additional** login method: they are off unless you set `auth.passkey`, and password (and Google) login keep working.

### How it works

- A signed-in user adds a passkey to their account (`NUsersPasskeyManager`). Passkey-only signup is not supported: every account keeps a password or a Google login.
- On the login page, a "Sign in with a passkey" button runs a *usernameless* flow: the browser offers the user's passkeys for your site, so no email is typed and the server never reveals whether an account exists.
- A successful passkey login is a complete login. It issues the same session token and cookie as a password login, so permissions, middleware and logout behave identically. There is no separate second factor.
- Inactive users (soft-deleted, or email not yet confirmed) cannot sign in with a passkey, just like with a password.
- A user who loses their passkey recovers through the normal [password reset](/user-guide/password-reset).

### Configuration

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    auth: {
      passkey: {
        // The domain passkeys are bound to: no scheme, no port. Passkeys only work on this
        // domain and its subdomains, and changing it later invalidates every saved passkey.
        rpId: 'example.com',
        // Name shown by the authenticator (default: 'Nuxt Users')
        rpName: 'Example',
        // Origins allowed to run the ceremony (scheme + host + port)
        origins: ['https://example.com'],
        // 'required' | 'preferred' | 'discouraged' (default: 'preferred')
        userVerification: 'preferred'
      }
    }
  }
})
```

`auth.passkey: {}` enables passkeys with the development defaults.

| Option | Default | Notes |
|---|---|---|
| `rpId` | host of `siteUrl`, else `'localhost'` in development | **Required in production** (or set `siteUrl`) |
| `origins` | origin of `siteUrl`, else `['http://localhost:3000']` in development | **Required in production** (or set `siteUrl`). Array, single string or comma-separated string |
| `rpName` | `'Nuxt Users'` | |
| `userVerification` | `'preferred'` | `'required'` makes the authenticator ask for a PIN or biometric |

The relying party is never guessed from the request's Host header (it can be spoofed or rewritten by a proxy). Both default from the configured `siteUrl` (its host and origin), so setting `siteUrl` is enough for most apps. In production the server **refuses to start** when neither `rpId` nor `siteUrl` (or neither `origins` nor `siteUrl`) is set. To set them from environment variables, declare the keys in your config (even empty, for example `rpId: ''`) so Nuxt applies `NUXT_NUXT_USERS_AUTH_PASSKEY_RP_ID` and `NUXT_NUXT_USERS_AUTH_PASSKEY_ORIGINS`. Nuxt cannot fill array items, so indexed variables such as `..._ORIGINS_0` are ignored: use `NUXT_NUXT_USERS_AUTH_PASSKEY_ORIGINS=https://example.com`, a comma-separated list (`https://a.com,https://b.com`) or a JSON array (`'["https://example.com"]'`).

WebAuthn needs a secure context: HTTPS, or `localhost` during development.

### Database

Passkeys use two tables, `passkeys` and `passkey_challenges` (names configurable under `tables.passkeys` and `tables.passkeyChallenges`). They are created by the `create_passkey_tables` migration, which runs automatically on server start. To create them by hand:

```bash
npx nuxt-users create-passkey-tables
```

- `passkeys` holds the public key, signature counter, transports and the user's WebAuthn user handle. A user can have several passkeys, for example one on a laptop and one on a phone. Deleting a user with `hardDelete` also deletes their passkeys.
- `users.passkey_user_handle` is the user's WebAuthn user handle: random (never derived from the user id), created on the first passkey registration and kept when the user deletes all their passkeys. An authenticator only replaces a passkey with the same handle, so a passkey added again replaces the removed one on the device instead of sitting next to it. Added by the `add_passkey_user_handle_to_users` migration, which takes it from each user's oldest passkey.
- `passkey_challenges` holds short-lived, single-use challenges (5 minute TTL). The scheduled `nuxt-users:cleanup-tokens` task removes expired ones.

### Components

Add the login button inside `NUsersLoginForm`: it appears automatically when `auth.passkey` is set and the browser supports passkeys.

```vue
<NUsersLoginForm redirect-to="/profile" @success="(user, rememberMe) => login(user, rememberMe)" />
```

The form's `success` event fires for password and passkey logins alike. To place the button yourself, use the `passkey-button` slot or the standalone `NUsersPasskeyLoginButton`.

Let users manage their passkeys on any page, for example a profile or settings page:

```vue
<NUsersPasskeyManager @registered="onAdded" @removed="onRemoved" />
```

See [Components](/user-guide/components#nuserspasskeyloginbutton) and the [`usePasskeys()`](/user-guide/composables#usepasskeys) composable for a custom UI.

### API endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/nuxt-users/passkey/login/options` | public | Start a login (usernameless) |
| `POST` | `/api/nuxt-users/passkey/login/verify` | public | Finish a login, sets the session cookie |
| `POST` | `/api/nuxt-users/passkey/register/options` | signed-in | Start adding a passkey |
| `POST` | `/api/nuxt-users/passkey/register/verify` | signed-in | Finish adding a passkey |
| `GET` | `/api/nuxt-users/passkeys` | signed-in | List the current user's passkeys |
| `DELETE` | `/api/nuxt-users/passkeys/:id` | signed-in | Remove one of the current user's passkeys |

`login/verify` answers `401` with `statusMessage: 'Unknown passkey'` and `data: { code: 'unknown_credential', rpId, credentialId }` when the device offers a passkey the server no longer has. Other failures stay a generic `Invalid passkey`.

### Removed passkeys on the device

Removing a passkey in the app does not remove it from the device by itself. `usePasskeys()` (and so `NUsersPasskeyLoginButton` and `NUsersPasskeyManager`) uses the [WebAuthn Signal API](https://w3c.github.io/webauthn/#sctn-signal-methods) where the browser supports it:

- After a passkey login and after a passkey is removed, it calls `PublicKeyCredential.signalAllAcceptCredentials()` with every passkey the user still has, so the authenticators drop the removed ones and keep the others. `login/verify` and `DELETE /passkeys/:id` return that list as `passkeys: { rpId, userId, allAcceptedCredentialIds }`.
- When a login fails with `Unknown passkey`, it calls `PublicKeyCredential.signalUnknownCredential()`, and the login button shows a message asking the user to delete the passkey from the device and add a new one.

In browsers without the Signal API nothing changes, and the user deletes a stale passkey in their password manager.

The login endpoints are whitelisted automatically when `auth.passkey` is set. The other endpoints are open to every signed-in user whatever their role, because they only ever touch the user's own passkeys. All endpoints answer `404` when passkeys are not enabled. The API never returns key material.

### Security notes

- **Rate limiting**: the module has no built-in rate limiter. Put one in front of `/api/nuxt-users/passkey/login/*`, as described in [Rate Limiting](#rate-limiting-recommended).
- **Adding a passkey needs only a valid session**: there is no password re-entry step, so a stolen session could add a passkey. Re-authentication for sensitive actions is not part of this feature.
- **Cloned authenticators**: if a passkey's signature counter does not increase, the login is rejected and a warning is logged. Synced passkeys (iCloud Keychain, Google Password Manager) always report a counter of 0 and are accepted.
- **Attestation is not requested**: any authenticator can register, which is the right default for passkeys.

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