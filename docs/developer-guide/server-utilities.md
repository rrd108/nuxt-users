# Server Utilities

This document covers the internal server-side utilities and functions used within the Nuxt Users module. These utilities are primarily intended for module contributors and developers who need to understand or extend the module's server-side functionality.

## H3 Event Handler Utilities

### defineEventHandler()

The `defineEventHandler()` function from H3 is used throughout the module to create API route handlers. This is the standard way to define server-side endpoints in Nuxt.

```typescript
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  // Handle the request
  return { message: 'Hello World' }
})
```

**Usage in the module:**
- All API routes use `defineEventHandler()` to handle HTTP requests
- Server middleware uses it for authentication and authorization checks
- Event handlers receive an `event` object containing request context

### getCookie()

The `getCookie()` function from H3 is used to read HTTP cookies from incoming requests, primarily for authentication token retrieval.

```typescript
import { getCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
```

**Usage in the module:**
- Authentication middleware reads the `auth_token` cookie
- Protected API routes verify user authentication via cookies
- Session management endpoints handle cookie-based authentication

### setCookie()

The `setCookie()` function from H3 is used to set HTTP cookies in responses, particularly for authentication tokens.

```typescript
import { setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  // Set authentication cookie
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
})
```

### readBody()

The `readBody()` function from H3 is used to parse request bodies in POST/PATCH endpoints.

```typescript
import { readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body
  // Process the data
})
```

### getQuery()

The `getQuery()` function from H3 is used to parse URL query parameters.

```typescript
import { getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { page, limit } = query
  // Use query parameters
})
```

### createError()

The `createError()` function from H3 is used to create HTTP error responses with appropriate status codes.

```typescript
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  if (!isAuthorized) {
    throw createError({ 
      statusCode: 403, 
      statusMessage: 'Forbidden' 
    })
  }
})
```

## Nuxt Runtime Utilities

### useRuntimeConfig()

The `useRuntimeConfig()` function from Nuxt is used to access module configuration at runtime.

```typescript
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  const options = nuxtUsers as ModuleOptions
  // Use configuration options
})
```

**Usage in the module:**
- All server-side code accesses module configuration through `useRuntimeConfig()`
- Configuration includes database settings, authentication options, and table names
- Runtime config is type-safe and provides access to user-defined options

## Module-Specific Server Composables

### useServerAuth()

Server-side composable for authentication utilities. Provides methods to get the current authenticated user from server-side contexts.

```typescript
import { useServerAuth } from '#nuxt-users/server'

export default defineEventHandler(async (event) => {
  const { getCurrentUser } = useServerAuth()
  const user = await getCurrentUser(event)
  
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  return { message: `Hello ${user.name}!` }
})
```

**Methods:**
- `getCurrentUser(event)`: Returns the authenticated user or null

### useNuxtUsersDatabase()

Server-side utility to access the module's database connection. Provides direct access to the same database instance used by the module.

```typescript
import { useNuxtUsersDatabase } from '#nuxt-users/server'

export default defineEventHandler(async (event) => {
  const { database, options } = await useNuxtUsersDatabase()
  
  // Execute custom queries using the module's database connection
  const customData = await database.sql`
    SELECT * FROM my_custom_table 
    WHERE user_id = ${userId}
  `
  
  return customData
})
```

**Returns:**
- `database`: The database connection instance
- `options`: Module configuration including table names and connector settings

## Internal Server Utilities

### User Management Functions

These functions are used internally by the module's API routes for user operations:

#### createUser()
Creates a new user with password hashing and validation.

```typescript
import { createUser } from '#nuxt-users/server/utils'

const newUser = await createUser({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'securePassword123',
  role: 'user',
  active: true
}, options)
```

#### findUserByEmail()
Finds a user by their email address.

```typescript
import { findUserByEmail } from '#nuxt-users/server/utils'

const user = await findUserByEmail('user@example.com', options)
```

#### findUserById()
Finds a user by their ID, with optional password inclusion.

```typescript
import { findUserById } from '#nuxt-users/server/utils'

// Without password
const user = await findUserById(123, options)

// With password (for authentication)
const userWithPassword = await findUserById(123, options, true)
```

#### updateUser()
Updates user information with field validation.

```typescript
import { updateUser } from '#nuxt-users/server/utils'

const updatedUser = await updateUser(123, {
  name: 'Jane Doe',
  email: 'jane@example.com',
  active: true
}, options)
```

#### deleteUser()
Deletes a user by their ID.

```typescript
import { deleteUser } from '#nuxt-users/server/utils'

await deleteUser(123, options)
```

### Authentication Functions

#### getCurrentUserFromToken()
Retrieves user information from an authentication token.

```typescript
import { getCurrentUserFromToken } from '#nuxt-users/server/utils'

const user = await getCurrentUserFromToken(token, options)
```

#### updateUserPassword()
Updates a user's password with validation and hashing.

```typescript
import { updateUserPassword } from '#nuxt-users/server/utils'

await updateUserPassword('user@example.com', 'newPassword123', options)
```

### Token Management Functions

#### cleanupPersonalAccessTokens()
Removes expired tokens and optionally tokens without expiration dates.

```typescript
import { cleanupPersonalAccessTokens } from '#nuxt-users/server/utils'

const result = await cleanupPersonalAccessTokens(options, true)
// Returns: { expiredCount, noExpirationCount, totalCount }
```

#### revokeUserTokens()
Revokes all tokens for a specific user.

```typescript
import { revokeUserTokens } from '#nuxt-users/server/utils'

await revokeUserTokens(userId, options)
```

### Database Utilities

#### useDb()
Creates a database connection using the module's configuration.

```typescript
import { useDb } from '#nuxt-users/server/utils'

const db = await useDb(options)
const result = await db.sql`SELECT * FROM users WHERE active = true`
```

#### checkTableExists()
Checks if a database table exists.

```typescript
import { checkTableExists } from '#nuxt-users/server/utils'

const exists = await checkTableExists('users', options)
```

## Server Middleware

### Authorization Middleware

The module includes server middleware that handles authentication and authorization for all requests.

**Key features:**
- Checks authentication tokens from cookies
- Validates user permissions based on roles
- Handles whitelisted paths that don't require authentication
- Provides different behavior for API routes vs. page routes

**Internal implementation details:**
- Uses `getCookie()` to read authentication tokens
- Calls `getCurrentUserFromToken()` to validate tokens
- Uses permission utilities to check role-based access
- Throws HTTP errors for unauthorized API requests
- Allows client-side handling for unauthorized page requests

## Password Reset Service

### sendPasswordResetLink()
Generates and sends password reset emails to users.

```typescript
import { sendPasswordResetLink } from '#nuxt-users/server/services'

await sendPasswordResetLink('user@example.com', options)
```

**Features:**
- Generates secure random tokens
- Stores hashed tokens in the database
- Sends HTML and text email notifications
- Includes configurable expiration times

### resetPassword()
Processes password reset requests using valid tokens.

```typescript
import { resetPassword } from '#nuxt-users/server/services'

const success = await resetPassword(token, email, newPassword, options)
```

**Features:**
- Validates tokens against hashed database values
- Checks token expiration
- Updates user passwords with validation
- Cleans up used tokens

## Error Handling Patterns

The module uses consistent error handling patterns:

1. **Authentication Errors**: Return 401 for invalid/missing tokens
2. **Authorization Errors**: Return 403 for insufficient permissions  
3. **Validation Errors**: Return 400 for invalid input data
4. **Not Found Errors**: Return 404 for missing resources
5. **Server Errors**: Return 500 for unexpected failures

## Security Considerations

When working with these server utilities:

1. **Always validate input data** before processing
2. **Use parameterized queries** to prevent SQL injection
3. **Hash passwords** before storing in the database
4. **Validate tokens** before trusting user authentication
5. **Log security events** for monitoring and debugging
6. **Handle errors gracefully** without exposing sensitive information

## Testing Server Utilities

The module includes comprehensive tests for server utilities. When contributing:

1. **Write unit tests** for new utility functions
2. **Test error conditions** and edge cases
3. **Mock external dependencies** like databases and email services
4. **Verify security measures** like password hashing and token validation
5. **Test integration** between different utilities

See the [Testing Guide](./testing.md) for more information on running and writing tests.