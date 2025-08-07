# Types & Utilities

The Nuxt Users module exports TypeScript types and server utilities that you can use in your Nuxt application for type safety and extended functionality.

## Installation & Import

After installing the module, import types and utilities from the utils export:

```typescript
// Import types (no runtime impact)
import type { 
  User, 
  UserWithoutPassword, 
  PersonalAccessToken, 
  PasswordResetToken 
} from 'nuxt-users/utils'

// Import server utilities (server-side only)
import { getLastLoginTime, findUserByEmail, getCurrentUserFromToken } from 'nuxt-users/utils'
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
  created_at: string  // ISO datetime string
  updated_at: string  // ISO datetime string
}
```

::: warning
The `User` type includes the password field. Use `UserWithoutPassword` for client-side operations.
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

## Server Utilities

These utilities are available for server-side use only (API routes, middleware, etc.):

### getLastLoginTime()

Get when a user last logged in based on their most recent token creation:

```typescript
getLastLoginTime(userId: number, options: ModuleOptions): Promise<string | null>
```

**Parameters:**
- `userId` - The user's ID
- `options` - Module configuration (get from `useRuntimeConfig().nuxtUsers`)

**Returns:** ISO datetime string of last login, or `null` if user never logged in

**Example:**
```typescript
// server/api/user/last-login.get.ts
export default defineEventHandler(async (event) => {
  const userId = 1 // Get from auth context
  const config = useRuntimeConfig()
  
  const lastLogin = await getLastLoginTime(userId, config.nuxtUsers)
  
  return { lastLogin }
})
```

### findUserByEmail()

Find a user by their email address:

```typescript
findUserByEmail(email: string, options: ModuleOptions): Promise<User | null>
```

**Parameters:**
- `email` - User's email address
- `options` - Module configuration

**Returns:** Complete user object with password, or `null` if not found

**Example:**
```typescript
// server/api/admin/find-user.post.ts
export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)
  const config = useRuntimeConfig()
  
  const user = await findUserByEmail(email, config.nuxtUsers)
  
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }
  
  // Remove password before sending to client
  const { password, ...safeUser } = user
  return safeUser
})
```

### getCurrentUserFromToken()

Get the current user from an authentication token:

```typescript
getCurrentUserFromToken<T extends boolean = false>(
  token: string,
  options: ModuleOptions,
  withPass: T = false as T
): Promise<T extends true ? User | null : UserWithoutPassword | null>
```

**Parameters:**
- `token` - Authentication token
- `options` - Module configuration
- `withPass` - Whether to include password in result (default: false)

**Returns:** User object (with or without password based on `withPass`), or `null`

**Example:**
```typescript
// server/api/user/profile.get.ts
export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'No token' })
  }
  
  const config = useRuntimeConfig()
  
  // Get user without password (safe for client)
  const user = await getCurrentUserFromToken(token, config.nuxtUsers, false)
  
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
  
  return { user }
})
```

## Password Validation Utilities

The module also exports password validation functions:

### validatePassword()

Validate password strength based on configured rules:

```typescript
validatePassword(
  password: string, 
  options: PasswordValidationOptions
): PasswordValidationResult
```

**Types:**
```typescript
interface PasswordValidationOptions {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventCommonPasswords: boolean
}

interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  score: number  // 0-4 strength score
}
```

**Example:**
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

## Complete Examples

### User Profile with Last Login

Create a comprehensive user profile API:

```typescript
// server/api/user/profile-complete.get.ts
import { getCurrentUserFromToken, getLastLoginTime } from 'nuxt-users/utils'
import type { UserWithoutPassword } from 'nuxt-users/utils'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  
  const config = useRuntimeConfig()
  
  // Get current user
  const user: UserWithoutPassword | null = await getCurrentUserFromToken(
    token, 
    config.nuxtUsers, 
    false
  )
  
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
  
  // Get last login time
  const lastLogin = await getLastLoginTime(user.id, config.nuxtUsers)
  
  return {
    user,
    lastLogin,
    memberSince: user.created_at,
    profileComplete: !!(user.name && user.email)
  }
})
```

### Type-Safe Vue Component

Use types in your Vue components:

```vue
<!-- components/UserCard.vue -->
<template>
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
    <p>Role: {{ user.role }}</p>
    <p v-if="lastLogin">Last login: {{ formatDate(lastLogin) }}</p>
    <p v-else>Never logged in</p>
  </div>
</template>

<script setup lang="ts">
import type { UserWithoutPassword } from 'nuxt-users/utils'

interface Props {
  user: UserWithoutPassword
  lastLogin?: string | null
}

const props = defineProps<Props>()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
```

### Admin User Management

Example admin functionality with type safety:

```typescript
// server/api/admin/users.get.ts
import { findUserByEmail, getLastLoginTime } from 'nuxt-users/utils'
import type { UserWithoutPassword, PersonalAccessToken } from 'nuxt-users/utils'

interface UserWithStats extends UserWithoutPassword {
  lastLogin: string | null
  tokenCount: number
}

export default defineEventHandler(async (event) => {
  // Check admin permissions here...
  
  const { email } = getQuery(event)
  const config = useRuntimeConfig()
  
  if (!email || typeof email !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Email required' })
  }
  
  const user = await findUserByEmail(email, config.nuxtUsers)
  
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }
  
  // Get additional stats
  const lastLogin = await getLastLoginTime(user.id, config.nuxtUsers)
  
  // Get token count (you'd implement this)
  const tokenCount = await getTokenCount(user.id, config.nuxtUsers)
  
  const { password, ...safeUser } = user
  
  const userWithStats: UserWithStats = {
    ...safeUser,
    lastLogin,
    tokenCount
  }
  
  return userWithStats
})
```

## TypeScript Integration

### Module Augmentation

For even better TypeScript integration, you can augment the module types in your project:

```typescript
// types/nuxt-users.d.ts
import type { User as BaseUser } from 'nuxt-users/utils'

declare module 'nuxt-users/utils' {
  interface User extends BaseUser {
    // Add custom fields if you extend the user table
    avatar?: string
    preferences?: Record<string, any>
  }
}
```

### Runtime Config Types

Access module configuration with full type safety:

```typescript
import type { ModuleOptions } from 'nuxt-users/utils'

// In server context
const config: ModuleOptions = useRuntimeConfig().nuxtUsers
```

This comprehensive type system ensures your Nuxt Users integration is fully type-safe and provides excellent developer experience!
