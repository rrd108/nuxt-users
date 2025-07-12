# CLI Commands

Learn about the available CLI commands for database management.

## Overview

The module provides several CLI commands for database operations:

- **Migration commands**: Create database tables
- **User management**: Create and manage users
- **Database utilities**: Check and maintain database state

## Available Commands

| Command | Description |
|---------|-------------|
| `yarn db:migrate` | Run all pending migrations (recommended) |
| `yarn db:create-users-table` | Create the users table |
| `yarn db:create-personal-access-tokens-table` | Create the personal access tokens table |
| `yarn db:create-password-reset-tokens-table` | Create the password reset tokens table |
| `yarn db:create-migrations-table` | Create the migrations tracking table |
| `yarn db:create-user <email> <name> <password>` | Create a new user |

## Migration Commands

### Run All Migrations

```bash
yarn db:migrate
```

This is the recommended way to set up your database. It will:

1. Create the migrations table if it doesn't exist
2. Check which migrations have already been applied
3. Run only the pending migrations
4. Mark each migration as applied after successful execution

**Example Output:**
```
[Nuxt Users DB] Starting migration...
[DB:Create Migrations sqlite Table] Creating migrations table with sqlite connector...
[DB:Create Migrations sqlite Table] successfull ✅
[DB:Create sqlite Users Table] Creating users...
[DB:Create sqlite Users Table] Fields: id, email, name, password, created_at, updated_at ✅
[DB:Create Personal Access Tokens sqlite Table] Creating personal_access_tokens table with sqlite connector...
[DB:Create Personal Access Tokens sqlite Table] Fields: id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at ✅
[DB:Create Password Reset Tokens sqlite Table] Creating password_reset_tokens table with sqlite connector...
[DB:Create Password Reset Tokens sqlite Table] Fields: id, email, token, created_at ✅
```

### Individual Table Creation

You can also create tables individually:

#### Create Users Table

```bash
yarn db:create-users-table
```

Creates the `users` table with the following structure:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Create Personal Access Tokens Table

```bash
yarn db:create-personal-access-tokens-table
```

Creates the `personal_access_tokens` table for storing authentication tokens.

#### Create Password Reset Tokens Table

```bash
yarn db:create-password-reset-tokens-table
```

Creates the `password_reset_tokens` table for password reset functionality.

#### Create Migrations Table

```bash
yarn db:create-migrations-table
```

Creates the `migrations` table for tracking applied migrations.

## User Management Commands

### Create User

```bash
yarn db:create-user <email> <name> <password>
```

Creates a new user in the database.

**Parameters:**
- `email`: User's email address (must be unique)
- `name`: User's display name
- `password`: User's password (will be hashed)

**Examples:**
```bash
# Create a test user
yarn db:create-user test@example.com "Test User" password123

# Create an admin user
yarn db:create-user admin@example.com "Admin User" securepassword456
```

**Example Output:**
```
[Nuxt Users] Creating user...
[DB:Create User] User created successfully: test@example.com
```

## Command Implementation

### How Commands Work

Each command is implemented as a standalone TypeScript file that can be executed directly:

```ts
// src/runtime/server/utils/create-user.ts
const createUserDefault = async () => {
  console.log('[Nuxt Users] Creating user...')
  
  const options = useRuntimeConfig().nuxtUsers
  const [email, name, password] = process.argv.slice(2)
  
  try {
    await createUser({ email, name, password }, options)
    console.log(`[DB:Create User] User created successfully: ${email}`)
    process.exit(0)
  } catch (error) {
    console.error('[DB:Create User] Error:', error)
    process.exit(1)
  }
}

// Run if this is the main module
if (process.argv[1] && process.argv[1].endsWith('create-user.ts')) {
  createUserDefault()
}
```

### Command Execution

Commands are executed using `tsx` for TypeScript support:

```json
{
  "scripts": {
    "db:create-user": "tsx src/runtime/server/utils/create-user.ts"
  }
}
```

## Database Configuration

### Environment Variables

Commands use the same configuration as your Nuxt application:

```ts
// Commands read from runtime config
const options = useRuntimeConfig().nuxtUsers
```

### Database Connectors

Commands support both SQLite and MySQL:

```ts
const connectorName = options.connector!.name
const connector = await getConnector(connectorName)
const db = createDatabase(connector(options.connector!.options))
```

## Error Handling

### Common Errors

1. **Missing parameters**: User creation requires email, name, and password
2. **Duplicate email**: Email addresses must be unique
3. **Database connection**: Check database configuration
4. **Permission denied**: Ensure database directory is writable

### Error Messages

Commands provide clear error messages:

```
[DB:Create User] Error: Email is required
[DB:Create User] Error: User with this email already exists
[DB:Create User] Error: Cannot connect to database
```

## Best Practices

### Development

1. **Use migrations**: Run `yarn db:migrate` for initial setup
2. **Create test users**: Use `yarn db:create-user` for testing
3. **Check logs**: Monitor command output for errors
4. **Backup data**: Backup before running destructive commands

### Production

1. **Test commands**: Test in staging environment first
2. **Secure passwords**: Use strong passwords for production users
3. **Monitor execution**: Log command execution for audit trails
4. **Backup database**: Always backup before running commands

## Troubleshooting

### Command Not Found

If commands are not found:

```bash
# Check if tsx is installed
npm list tsx

# Reinstall dependencies
yarn install

# Check script definitions
cat package.json | grep db:
```

### Database Connection Issues

```bash
# Check database configuration
cat nuxt.config.ts | grep nuxtUsers

# Test database connection
yarn db:migrate

# Check database file (SQLite)
ls -la data/
```

### Permission Issues

```bash
# Check file permissions
ls -la data/

# Fix permissions
chmod 755 data/
chmod 644 data/*.sqlite3
```

## Future Commands

### Planned Features

- **User management**: List, update, and delete users
- **Database backup**: Backup and restore database
- **Schema validation**: Verify database schema
- **Performance analysis**: Database performance metrics

### Example Future Commands

```bash
# List all users
yarn db:list-users

# Update user password
yarn db:update-user-password <email> <new-password>

# Backup database
yarn db:backup

# Restore database
yarn db:restore <backup-file>
```

## Next Steps

- [Database Schema](/database/schema) - Understand the database structure
- [Migrations](/database/migrations) - Learn about the migration system
- [Database Setup](/guide/database-setup) - Learn how to set up your database 