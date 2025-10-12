# Public Types

The Nuxt Users module exports TypeScript types that you can use in your Nuxt application for type safety and better development experience.

## Installation & Import

After installing the module, import types from the utils export:

```typescript
// Import types (no runtime impact)
import type { 
  User, 
  UserWithoutPassword, 
  PersonalAccessToken, 
  PasswordResetToken,
  LoginFormData,
  ModuleOptions,
  RuntimeModuleOptions
} from 'nuxt-users/utils'
```

## Core Entity Types

### User

Represents a complete user entity as stored in the database:

```typescript
interface User {
  id: number
  email: string
  name: string
  password: string  // ⚠️ Contains sensitive data
  role: string
  active: boolean
  google_id?: string  // Google OAuth ID (optional)
  profile_picture?: string  // Profile picture URL (optional, from Google)
  created_at: string  // ISO datetime string
  updated_at: string  // ISO datetime string
  last_login_at?: string  // ISO datetime string (optional)
}
```

::: warning
The `User` type includes the password field. Use `UserWithoutPassword` for client-side operations.
:::

::: info
The `google_id` and `profile_picture` fields are populated when users authenticate via Google OAuth.
:::

### UserWithoutPassword

Safe version of User without the password field, suitable for client-side use:

```typescript
type UserWithoutPassword = Omit<User, 'password'>
```

**Example usage:**
```typescript
// In your component or page
const user = ref<UserWithoutPassword | null>(null)

// Safe to send to client
return {
  user: user.value
}
```

### PersonalAccessToken

Represents authentication tokens stored in the database:

```typescript
interface PersonalAccessToken {
  id: number
  tokenable_type: string     // Usually 'user'
  tokenable_id: number       // References user.id
  name: string              // Token name/description
  token: string             // The actual token value
  abilities?: string        // JSON string of permissions (optional)
  last_used_at?: string    // When token was last used (optional)
  expires_at?: string      // Token expiration (optional)
  created_at: string       // When token was created
  updated_at: string       // Last updated
}
```

### PasswordResetToken

Represents password reset tokens:

```typescript
interface PasswordResetToken {
  id: number
  email: string      // User's email
  token: string      // Reset token (hashed)
  created_at: string // When reset was requested
}
```

### LoginFormData

Type for login form submissions:

```typescript
interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}
```

## Configuration Types

### RuntimeModuleOptions

Configuration options you can set in your `nuxt.config.ts`:

```typescript
interface RuntimeModuleOptions {
  connector?: {
    name: 'sqlite' | 'mysql' | 'postgresql'
    options: DatabaseConfig
  }
  apiBasePath?: string
  tables?: {
    migrations?: string
    users?: string
    personalAccessTokens?: string
    passwordResetTokens?: string
  }
  mailer?: MailerOptions
  passwordResetUrl?: string
  auth?: {
    whitelist?: string[]
    tokenExpiration?: number
    rememberMeExpiration?: number
    permissions?: Record<string, (string | Permission)[]>
    google?: GoogleOAuthOptions
  }
  passwordValidation?: {
    minLength?: number
    requireUppercase?: boolean
    requireLowercase?: boolean
    requireNumbers?: boolean
    requireSpecialChars?: boolean
    preventCommonPasswords?: boolean
  }
}
```

### GoogleOAuthOptions

Configuration options for Google OAuth authentication:

```typescript
interface GoogleOAuthOptions {
  /**
   * Google OAuth client ID from Google Cloud Console
   */
  clientId: string
  
  /**
   * Google OAuth client secret from Google Cloud Console
   */
  clientSecret: string
  
  /**
   * Callback URL for Google OAuth (must match what's configured in Google Cloud Console)
   * @default '/api/nuxt-users/auth/google/callback'
   */
  callbackUrl?: string
  
  /**
   * Redirect URL after successful authentication
   * @default '/'
   */
  successRedirect?: string
  
  /**
   * Redirect URL after failed authentication
   * @default '/login?error=oauth_failed'
   */
  errorRedirect?: string
  
  /**
   * Google OAuth scopes to request
   * @default ['openid', 'profile', 'email']
   */
  scopes?: string[]
  
  /**
   * Allow automatic user registration when logging in with Google for the first time
   * If false, only existing users with matching email can log in with Google
   * @default false
   */
  allowAutoRegistration?: boolean
}
```

**Example usage:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    auth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        allowAutoRegistration: false, // Only existing users can log in
        successRedirect: '/dashboard',
        errorRedirect: '/login?error=oauth_failed'
      }
    }
  }
})
```

::: tip
By default, `allowAutoRegistration` is `false` for security. This means only users with existing accounts (by email) can log in with Google. Set it to `true` to allow public registration via Google OAuth.
:::

::: warning
When `allowAutoRegistration: false`, new Google users will be redirected to `errorRedirect` with the error code `user_not_registered`.
:::

### ModuleOptions

Fully resolved module options (after merging with defaults):

```typescript
interface ModuleOptions {
  connector: {
    name: 'sqlite' | 'mysql' | 'postgresql'
    options: DatabaseConfig
  }
  apiBasePath: string
  tables: {
    migrations: string
    users: string
    personalAccessTokens: string
    passwordResetTokens: string
  }
  mailer?: MailerOptions
  passwordResetUrl: string
  auth: {
    whitelist: string[]
    tokenExpiration: number
    permissions: Record<string, (string | Permission)[]>
  }
  passwordValidation: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    preventCommonPasswords: boolean
  }
}
```

## Permission Types

### HttpMethod

A union type of possible HTTP methods for permission configuration:

```typescript
export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH'
```

### Permission

Represents a permission rule. It can be a simple `string` to allow access to a path for all methods, or an `object` to specify allowed methods for a path.

```typescript
export type Permission = string | {
  path: string
  methods: HttpMethod[]
}
```

## Component Props Types

### LoginFormProps

Props for the login form component:

```typescript
interface LoginFormProps {
  apiEndpoint?: string
  redirectTo?: string
  forgotPasswordEndpoint?: string
}
```

### ResetPasswordFormProps

Props for the password reset form component:

```typescript
interface ResetPasswordFormProps {
  apiEndpoint?: string
  updatePasswordEndpoint?: string
}
```

### DisplayFieldsProps

Props for components that display user information:

```typescript
interface DisplayFieldsProps {
  displayFields?: string[]
  fieldLabels?: Record<string, string>
}
```

## Password Validation Types

### PasswordValidationOptions

Configuration for password validation:

```typescript
interface PasswordValidationOptions {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
}
```

### PasswordValidationResult

Result of password validation:

```typescript
interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  score: number  // 0-4 strength score
}
```

## Password Validation Utilities

### validatePassword()

Validate password strength based on configured rules:

```typescript
import { validatePassword } from 'nuxt-users/utils'

const result = validatePassword('MyP@ssw0rd', {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true
})

if (!result.isValid) {
  console.log('Password errors:', result.errors)
}
```

## Server-Side Composable

### useServerAuth()

Server-side composable that provides authentication utilities:

```typescript
// server/api/protected-route.get.ts
export default defineEventHandler(async (event) => {
  const { getCurrentUser } = useServerAuth()
  const user = await getCurrentUser(event)
  
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  return { message: `Hello ${user.name}!` }
})
```

**Available functions:**
- `getCurrentUser(event)` - Get current authenticated user from H3Event, returns `UserWithoutPassword | null`

## Usage Examples

### Type-Safe Vue Component

Use types in your Vue components:

```vue
<!-- components/UserCard.vue -->
<template>
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
    <p>Role: {{ user.role }}</p>
    <p>Status: {{ user.active ? 'Active' : 'Inactive' }}</p>
    <p v-if="user.last_login_at">Last login: {{ formatDate(user.last_login_at) }}</p>
    <p v-else>Never logged in</p>
  </div>
</template>

<script setup lang="ts">
import type { UserWithoutPassword } from 'nuxt-users/utils'

interface Props {
  user: UserWithoutPassword
}

const props = defineProps<Props>()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
```

### Configuration with Types

Configure the module with full type safety:

```typescript
// nuxt.config.ts
import type { RuntimeModuleOptions } from 'nuxt-users/utils'

const nuxtUsersConfig: RuntimeModuleOptions = {
  auth: {
    whitelist: ['/register'],
    tokenExpiration: 1440, // 24 hours
    permissions: {
      admin: ['*'],
      user: ['/profile', '/api/nuxt-users/me'],
      moderator: ['/admin/*']
    }
  },
  passwordValidation: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true
  }
}

export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: nuxtUsersConfig
})
```

### Password Validation

Implement client-side password validation:

```vue
<!-- components/PasswordInput.vue -->
<template>
  <div>
    <input 
      v-model="password" 
      type="password" 
      @input="validatePasswordStrength"
    />
    <div v-if="validation && !validation.isValid" class="errors">
      <p v-for="error in validation.errors" :key="error">{{ error }}</p>
    </div>
    <div class="strength">
      Strength: {{ validation?.score || 0 }}/4
    </div>
  </div>
</template>

<script setup lang="ts">
import { validatePassword } from 'nuxt-users/utils'
import type { PasswordValidationResult } from 'nuxt-users/utils'

const password = ref('')
const validation = ref<PasswordValidationResult | null>(null)

const validatePasswordStrength = () => {
  if (password.value) {
    validation.value = validatePassword(password.value, {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true
    })
  } else {
    validation.value = null
  }
}
</script>
```

This type system ensures your Nuxt Users integration is fully type-safe and provides excellent developer experience!