# Database Internals

This guide covers the internal database utilities and functions used by the Nuxt Users module. These utilities are primarily intended for module contributors and advanced developers who need to extend the module's functionality or integrate with its database layer.

## Core Database Utilities

### `useNuxtUsersDatabase()`

The primary server-side utility for accessing the module's database connection. This provides access to the same database instance used by the module for user authentication, tokens, and other core functionality.

```typescript
import { useNuxtUsersDatabase } from '#nuxt-users/server'

export default defineEventHandler(async (event) => {
  const { database, options } = await useNuxtUsersDatabase()
  
  // Access the database instance
  const users = await database.sql`SELECT * FROM ${options.tables.users}`
  
  return users
})
```

**Returns:**
- `database`: The db0 database instance
- `options`: Module configuration including table names and connector settings

**Important Notes:**
- This is a server-side only utility and should not be used in client-side code
- The database instance uses the same connection and configuration as the module
- Available in API routes, server middleware, and other server-side contexts

### `useDb(options)`

Lower-level database utility that creates a database connection based on the provided options. This is used internally by `useNuxtUsersDatabase()` and other database utilities.

```typescript
import { useDb } from '#nuxt-users/server'
import type { ModuleOptions } from '#nuxt-users/types'

const options: ModuleOptions = {
  connector: {
    name: 'sqlite',
    options: { path: './data/users.sqlite3' }
  },
  tables: {
    users: 'users',
    personalAccessTokens: 'personal_access_tokens',
    passwordResetTokens: 'password_reset_tokens'
  }
}

const db = await useDb(options)
const result = await db.sql`SELECT * FROM users`
```

**Parameters:**
- `options`: ModuleOptions containing connector and table configuration

**Returns:**
- Database instance created with db0

### `getConnector(name)`

Dynamically imports and returns the appropriate database connector based on the connector name.

```typescript
import { getConnector } from '#nuxt-users/server'

const connector = await getConnector('sqlite')
// Returns the better-sqlite3 connector

const mysqlConnector = await getConnector('mysql')
// Returns the mysql2 connector

const pgConnector = await getConnector('postgresql')
// Returns the postgresql connector
```

**Supported Connectors:**
- `sqlite`: Uses better-sqlite3
- `mysql`: Uses mysql2
- `postgresql`: Uses pg

**Error Handling:**
- Throws descriptive errors if the connector package is not installed
- Provides installation instructions for missing peer dependencies

### `checkTableExists(options, tableName)`

Utility function to check if a specific table exists in the database.

```typescript
import { checkTableExists } from '#nuxt-users/server'

const exists = await checkTableExists(options, 'users')
if (!exists) {
  console.log('Users table does not exist')
}
```

**Parameters:**
- `options`: ModuleOptions containing database configuration
- `tableName`: Name of the table to check

**Returns:**
- `boolean`: True if table exists, false otherwise

## Migration System

### `runMigrations(options)`

Executes all pending database migrations. This is the main entry point for the migration system.

```typescript
import { runMigrations } from '#nuxt-users/server'

await runMigrations(options)
```

**Migration Process:**
1. Ensures migrations table exists
2. Checks which migrations have been applied
3. Runs pending migrations in order
4. Marks each migration as applied after successful execution

**Built-in Migrations:**
- `create_migrations_table`: Creates the migrations tracking table
- `create_users_table`: Creates the users table
- `create_personal_access_tokens_table`: Creates the tokens table
- `create_password_reset_tokens_table`: Creates the password reset tokens table
- `add_active_to_users`: Adds the active column to users table

### `getAppliedMigrations(options)`

Returns a list of migrations that have already been applied to the database.

```typescript
import { getAppliedMigrations } from '#nuxt-users/server'

const applied = await getAppliedMigrations(options)
console.log('Applied migrations:', applied)
// Output: ['create_migrations_table', 'create_users_table', ...]
```

### `markMigrationAsApplied(options, migrationName)`

Marks a specific migration as applied in the migrations table.

```typescript
import { markMigrationAsApplied } from '#nuxt-users/server'

await markMigrationAsApplied(options, 'my_custom_migration')
```

## Table Creation Utilities

### `createUsersTable(options)`

Creates the users table with the appropriate schema for the configured database connector.

```typescript
import { createUsersTable } from '#nuxt-users/server'

await createUsersTable(options)
```

**Table Schema:**
- `id`: Primary key (auto-increment)
- `email`: Unique email address
- `name`: User's display name
- `password`: Hashed password
- `role`: User role (default: 'user')
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `active`: User active status (added by migration)

### `createPersonalAccessTokensTable(options)`

Creates the personal access tokens table for authentication tokens.

```typescript
import { createPersonalAccessTokensTable } from '#nuxt-users/server'

await createPersonalAccessTokensTable(options)
```

### `createPasswordResetTokensTable(options)`

Creates the password reset tokens table for password reset functionality.

```typescript
import { createPasswordResetTokensTable } from '#nuxt-users/server'

await createPasswordResetTokensTable(options)
```

### `createMigrationsTable(options)`

Creates the migrations tracking table used by the migration system.

```typescript
import { createMigrationsTable } from '#nuxt-users/server'

await createMigrationsTable(options)
```

## User Management Utilities

### `createUser(userData, options)`

Creates a new user in the database with password hashing and validation.

```typescript
import { createUser } from '#nuxt-users/server'

const user = await createUser({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'securePassword123',
  role: 'admin',
  active: true
}, options)
```

**Features:**
- Automatic password hashing with bcrypt
- Password strength validation
- Returns user data without password
- Handles database-specific timestamp formatting

### `findUserByEmail(email, options)`

Finds a user by their email address.

```typescript
import { findUserByEmail } from '#nuxt-users/server'

const user = await findUserByEmail('user@example.com', options)
if (user) {
  console.log('User found:', user.name)
}
```

### `findUserById(id, options, withPass?)`

Finds a user by their ID with optional password inclusion.

```typescript
import { findUserById } from '#nuxt-users/server'

// Without password (default)
const user = await findUserById(1, options)

// With password
const userWithPassword = await findUserById(1, options, true)
```

### `updateUser(id, userData, options)`

Updates user information with security safeguards.

```typescript
import { updateUser } from '#nuxt-users/server'

const updatedUser = await updateUser(1, {
  name: 'New Name',
  role: 'admin',
  active: false
}, options)
```

**Security Features:**
- Only allows updating specific fields (name, email, role, active)
- Automatically revokes tokens when user is deactivated
- Prevents mass-assignment vulnerabilities

### `updateUserPassword(email, newPassword, options)`

Updates a user's password with validation and hashing.

```typescript
import { updateUserPassword } from '#nuxt-users/server'

await updateUserPassword('user@example.com', 'newSecurePassword', options)
```

### `deleteUser(id, options)`

Deletes a user from the database.

```typescript
import { deleteUser } from '#nuxt-users/server'

await deleteUser(1, options)
```

## Token Management Utilities

### `getCurrentUserFromToken(token, options, withPass?)`

Retrieves user information from an authentication token.

```typescript
import { getCurrentUserFromToken } from '#nuxt-users/server'

const user = await getCurrentUserFromToken('auth-token', options)
if (user) {
  console.log('Authenticated user:', user.name)
}
```

**Features:**
- Validates token expiration
- Updates last_used_at timestamp
- Checks user active status
- Optional password inclusion

### `cleanupPersonalAccessTokens(options, includeNoExpiration?)`

Comprehensive token cleanup utility.

```typescript
import { cleanupPersonalAccessTokens } from '#nuxt-users/server'

const result = await cleanupPersonalAccessTokens(options, true)
console.log(`Cleaned up ${result.totalCount} tokens`)
```

**Returns:**
- `expiredCount`: Number of expired tokens removed
- `noExpirationCount`: Number of tokens without expiration removed
- `totalCount`: Total tokens removed

### `revokeUserTokens(userId, options)`

Revokes all tokens for a specific user.

```typescript
import { revokeUserTokens } from '#nuxt-users/server'

await revokeUserTokens(1, options)
```

### `getLastLoginTime(userId, options)`

Gets the last login time for a user based on their most recent token creation.

```typescript
import { getLastLoginTime } from '#nuxt-users/server'

const lastLogin = await getLastLoginTime(1, options)
if (lastLogin) {
  console.log('Last login:', new Date(lastLogin))
}
```

## Utility Functions

### `hasAnyUsers(options)`

Checks if any users exist in the database.

```typescript
import { hasAnyUsers } from '#nuxt-users/server'

const usersExist = await hasAnyUsers(options)
if (!usersExist) {
  console.log('No users found - first time setup')
}
```

## Database Connector Support

The module supports three database connectors with automatic schema adaptation:

### SQLite (better-sqlite3)
- File-based database
- Ideal for development and small applications
- Uses `INTEGER PRIMARY KEY AUTOINCREMENT`
- Supports `DATETIME` for timestamps

### MySQL (mysql2)
- Full-featured MySQL support
- Uses `INT AUTO_INCREMENT PRIMARY KEY`
- Supports `VARCHAR` with length specifications
- Uses `DATETIME` for timestamps

### PostgreSQL (pg)
- Enterprise-grade PostgreSQL support
- Uses `SERIAL PRIMARY KEY`
- Supports `VARCHAR` with length specifications
- Uses `TIMESTAMPTZ` for timezone-aware timestamps

## Error Handling

The database utilities include comprehensive error handling:

- **Connection Errors**: Descriptive messages for database connection failures
- **Missing Dependencies**: Clear instructions for installing required peer dependencies (bcrypt, database drivers, nodemailer)
- **Migration Failures**: Detailed error reporting with rollback capabilities
- **Validation Errors**: Password and data validation with specific error messages
- **Table Existence**: Graceful handling of missing tables

## Best Practices

### For Module Contributors

1. **Always use transactions** for multi-step operations
2. **Validate input data** before database operations
3. **Handle database-specific differences** in SQL queries
4. **Use parameterized queries** to prevent SQL injection
5. **Test with all supported database connectors**

### For Advanced Users

1. **Use `useNuxtUsersDatabase()`** instead of direct database access
2. **Respect the module's table structure** when extending functionality
3. **Follow the migration pattern** for schema changes
4. **Handle errors gracefully** in production environments
5. **Monitor token cleanup** for performance optimization

## Integration Examples

### Custom API Route with Database Access

```typescript
// server/api/admin/users.get.ts
export default defineEventHandler(async (event) => {
  const { database, options } = await useNuxtUsersDatabase()
  
  // Get all active users with their last login
  const users = await database.sql`
    SELECT u.*, 
           (SELECT MAX(created_at) 
            FROM ${options.tables.personalAccessTokens} 
            WHERE tokenable_id = u.id) as last_login
    FROM ${options.tables.users} u
    WHERE u.active = true
    ORDER BY u.created_at DESC
  `
  
  return users.rows
})
```

### Custom Migration

```typescript
// Custom migration function
const addCustomFieldToUsers = async (options: ModuleOptions) => {
  const db = await useDb(options)
  const tableName = options.tables.users
  
  await db.sql`ALTER TABLE ${tableName} ADD COLUMN custom_field TEXT`
}

// Add to migrations array
const customMigrations = [
  {
    name: 'add_custom_field_to_users',
    run: addCustomFieldToUsers
  }
]
```

This documentation provides comprehensive coverage of the internal database utilities while maintaining focus on developer and contributor needs. The utilities are powerful tools for extending the module's functionality and integrating with existing database systems.