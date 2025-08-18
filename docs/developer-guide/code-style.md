# Code Style Guide

Follow these coding standards when contributing to Nuxt Users.

## TypeScript

### General Guidelines

- **Use TypeScript**: All new code should be written in TypeScript
- **Strict typing**: Avoid `any` type when possible
- **Arrow functions**: Use arrow functions consistently
- **No semicolons**: Don't use semicolons in JavaScript/TypeScript files
- **Use semicolons**: Use semicolons in PHP files

### Type Definitions

```ts
// Good: Proper type definitions
interface User {
  id: number
  email: string
  name: string
  password: string
  role: string
  created_at: string
  updated_at: string
}

// Good: Function with proper types
const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
  // Implementation
}

// Avoid: Using any type
const badFunction = (data: any) => {
  // Implementation
}
```

### Import/Export

```ts
// Good: Named imports
import { createDatabase } from 'db0'
import type { ModuleOptions } from '../../../types'

// Good: Default exports for main modules
export default defineNuxtModule<ModuleOptions>({
  // Configuration
})

// Good: Named exports for utilities
export const createUser = async () => {
  // Implementation
}
```

## Vue Components

### Composition API

Use Composition API with `<script setup>`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { User } from '~/src/types'

interface Props {
  apiEndpoint?: string
  redirectTo?: string
}

interface Emits {
  (e: 'success', user: User): void
  (e: 'error', error: string): void
}

const props = withDefaults(defineProps<Props>(), {
  apiEndpoint: '/api/nuxt-users/session',
  redirectTo: '/'
})

const emit = defineEmits<Emits>()

const isLoading = ref(false)
const error = ref('')

const handleSubmit = async (formData: LoginFormData) => {
  // Implementation
}
</script>
```

### Template Structure

```vue
<template>
  <div class="component-container">
    <!-- Header -->
    <slot name="header">
      <div class="default-header">
        <h2>Default Title</h2>
      </div>
    </slot>

    <!-- Main content -->
    <div class="main-content">
      <slot />
    </div>

    <!-- Footer -->
    <slot name="footer" />
  </div>
</template>
```

### Styling

```vue
<style scoped>
/* Use CSS custom properties for theming */
.component-container {
  --border-color: #d1d5db;
  --border-color-focus: #3b82f6;
  --bg-color: #f9fafb;
}

/* Use :deep() for targeting child components */
:deep(.formkit-input) {
  border-color: var(--border-color);
}

:deep(.formkit-input:focus) {
  border-color: var(--border-color-focus);
}
</style>
```

## Database Code

### SQL Queries

```ts
// Good: Parameterized queries
const user = await db.sql`
  SELECT * FROM ${tableName} 
  WHERE email = ${email}
` as { rows: User[] }

// Good: Table name interpolation
await db.sql`
  CREATE TABLE IF NOT EXISTS ${tableName} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE
  )
`

// Avoid: String concatenation
const badQuery = `SELECT * FROM users WHERE email = '${email}'`
```

### Error Handling

```ts
// Good: Proper error handling
try {
  const result = await db.sql`SELECT * FROM users`
  return result.rows
} catch (error) {
  console.error('[Nuxt Users] Database query failed:', error)
  throw new Error('Failed to fetch users')
}

// Good: Database-specific handling
if (connectorName === 'sqlite') {
  await db.sql`CREATE TABLE users (...)`
} else if (connectorName === 'mysql') {
  await db.sql`CREATE TABLE users (...)`
} else if (connectorName === 'postgresql') {
  await db.sql`CREATE TABLE users (...)`
}
```

## API Routes

### Request Handling

```ts
// Good: Proper request validation
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required'
    })
  }

  // Implementation
})
```

### Response Format

```ts
// Good: Consistent response format
return {
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at,
    updated_at: user.updated_at
  }
}

// Good: Error responses
throw createError({
  statusCode: 401,
  statusMessage: 'Invalid email or password'
})
```

## File Organization

### Directory Structure

```
src/
├── module.ts                    # Main module file
├── types.ts                     # TypeScript types
└── runtime/
    ├── components/              # Vue components
    ├── plugin.ts               # Nuxt plugin
    └── server/
        ├── api/                # API endpoints
        ├── services/           # Business logic
        └── utils/              # Database utilities
```

### File Naming

- **kebab-case**: For files and directories
- **PascalCase**: For Vue components
- **camelCase**: For functions and variables
- **UPPER_CASE**: For constants

```ts
// File names
create-users-table.ts
create-user.ts
database-utils.ts

// Component names
NUsersLoginForm.vue

// Function names
createUser()
checkUsersTableExists()
getConnector()
```

## Comments and Documentation

### Code Comments

```ts
/**
 * Creates a new user in the database
 * @param userData - User data to create
 * @param options - Module options
 * @returns Promise<User> - Created user
 */
export const createUser = async (
  userData: CreateUserData,
  options: ModuleOptions
): Promise<User> => {
  // Hash password before storing
  const hashedPassword = await bcrypt.hash(userData.password, 10)
  
  // Insert user into database
  const result = await db.sql`
    INSERT INTO ${options.tables.users} (email, name, password)
    VALUES (${userData.email}, ${userData.name}, ${hashedPassword})
  `
  
  return result
}
```

### JSDoc Comments

```ts
/**
 * Module options interface
 */
export interface ModuleOptions {
  /** Database connector configuration */
  connector?: {
    /** Database type (sqlite, mysql) */
    name: DatabaseType
    /** Database connection options */
    options: DatabaseConfig
  }
  /** Table name configuration */
  tables: {
    /** Users table name */
    users: string
    /** Personal access tokens table name */
    personalAccessTokens: string
    /** Password reset tokens table name */
    passwordResetTokens: string
  }
  /** Mailer configuration for password resets */
  mailer?: MailerOptions
  /** Base URL for password reset links */
  passwordResetBaseUrl?: string
}
```

## Testing

### Test Structure

```ts
describe('Feature Name', () => {
  let db: Database
  let testOptions: ModuleOptions

  beforeEach(async () => {
    // Setup test environment
    const settings = await createTestSetup({
      dbType: 'sqlite',
      dbConfig: { path: './_test-db' }
    })
    
    db = settings.db
    testOptions = settings.testOptions
  })

  afterEach(async () => {
    // Cleanup test data
  })

  it('should do something', async () => {
    // Test implementation
    expect(result).toBe(expected)
  })

  it('should handle errors gracefully', async () => {
    // Error test
    await expect(asyncFunction()).rejects.toThrow('Error message')
  })
})
```

## Security Considerations

### Input Validation

```ts
// Good: Validate all inputs
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password: string): boolean => {
  return password.length >= 6
}
```

### Password Handling

```ts
// Good: Hash passwords with bcrypt
const hashedPassword = await bcrypt.hash(password, 10)

// Good: Compare passwords securely
const isValid = await bcrypt.compare(password, hashedPassword)
```

### SQL Injection Prevention

```ts
// Good: Use parameterized queries
await db.sql`SELECT * FROM users WHERE email = ${email}`

// Avoid: String concatenation
const badQuery = `SELECT * FROM users WHERE email = '${email}'`
```

## Performance

### Database Queries

```ts
// Good: Use indexes for performance
await db.sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)`

// Good: Limit query results
await db.sql`SELECT * FROM users LIMIT 10`

// Good: Use specific columns
await db.sql`SELECT id, email, name FROM users`
```

### Memory Management

```ts
// Good: Close database connections
const db = createDatabase(connector(options))
try {
  // Use database
} finally {
  await db.close()
}
```

## Common Patterns

### Configuration Pattern

```ts
export const defaultOptions: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/default.sqlite3'
    }
  },
  tables: {
    users: 'users',
    personalAccessTokens: 'personal_access_tokens',
    passwordResetTokens: 'password_reset_tokens'
  }
}
```

### Error Handling Pattern

```ts
const safeOperation = async () => {
  try {
    const result = await riskyOperation()
    return result
  } catch (error) {
    console.error('[Nuxt Users] Operation failed:', error)
    throw new Error('Operation failed')
  }
}
```

### Validation Pattern

```ts
const validateUserData = (data: unknown): UserData => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid user data')
  }
  
  const { email, name, password } = data as any
  
  if (!email || typeof email !== 'string') {
    throw new Error('Email is required')
  }
  
  if (!name || typeof name !== 'string') {
    throw new Error('Name is required')
  }
  
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required')
  }
  
  return { email, name, password }
}
```

## Next Steps

- [Development Setup](/developer-guide/development-setup) - Set up your development environment
- [Testing](/developer-guide/testing) - Learn about testing
- [Contributing](/developer-guide/contributing) - Understand contribution guidelines