# Database Migrations

Learn about the migration system in Nuxt Users.

## Overview

The module includes a migration system that tracks which database changes have been applied. This ensures that:

- Migrations are only run once
- Database schema is consistent across environments
- Future database changes can be safely applied

## Migration System

### How It Works

1. **Migrations Table**: A `migrations` table tracks all applied migrations
2. **Migration Tracking**: Each migration has a unique name and execution timestamp
3. **Safe Execution**: Only pending migrations are run
4. **Rollback Support**: Future versions may support rollback functionality

### Migration Table Schema

```sql
-- SQLite
CREATE TABLE migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- MySQL
CREATE TABLE migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PostgreSQL
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Available Migrations

### Core Migrations

| Migration | Description |
|-----------|-------------|
| `create_migrations_table` | Creates the migrations tracking table |
| `create_users_table` | Creates the users table |
| `create_personal_access_tokens_table` | Creates the personal access tokens table |
| `create_password_reset_tokens_table` | Creates the password reset tokens table |

### Migration Order

Migrations are applied in this order:

1. `create_migrations_table` - Sets up migration tracking
2. `create_users_table` - Creates user accounts table
3. `create_personal_access_tokens_table` - Creates authentication tokens table
4. `create_password_reset_tokens_table` - Creates password reset tokens table

## Running Migrations

### Run All Migrations (Recommended)

```bash
yarn db:migrate
```

This command will:

1. Create the migrations table if it doesn't exist
2. Check which migrations have already been applied
3. Run only the pending migrations
4. Mark each migration as applied after successful execution

### Individual Migration Commands

You can also run migrations individually:

```bash
# Create migrations table
yarn db:create-migrations-table

# Create users table
yarn db:create-users-table

# Create personal access tokens table
yarn db:create-personal-access-tokens-table

# Create password reset tokens table
yarn db:create-password-reset-tokens-table
```

## Migration Process

### 1. Check Applied Migrations

The system first checks which migrations have already been applied:

```ts
const appliedMigrations = await getAppliedMigrations(options)
```

### 2. Determine Pending Migrations

Only migrations that haven't been applied are executed:

```ts
const requiredMigrations = [
  'create_migrations_table',
  'create_users_table',
  'create_personal_access_tokens_table',
  'create_password_reset_tokens_table'
]

const missingMigrations = requiredMigrations.filter(
  migration => !appliedMigrations.includes(migration)
)
```

### 3. Execute Pending Migrations

Each migration is executed in order:

```ts
for (const migration of missingMigrations) {
  await executeMigration(migration, options)
  await markMigrationAsApplied(migration, options)
}
```

### 4. Mark as Applied

After successful execution, migrations are marked as applied:

```ts
await db.sql`
  INSERT INTO migrations (name, executed_at)
  VALUES (${migrationName}, CURRENT_TIMESTAMP)
`
```

## Migration Files

### Migration Structure

Each migration is implemented as a standalone script:

```ts
// src/runtime/server/utils/create-users-table.ts
export const createUsersTable = async (options: ModuleOptions) => {
  const connectorName = options.connector!.name
  const connector = await getConnector(connectorName)
  const db = createDatabase(connector(options.connector!.options))
  
  // Database-specific table creation
  if (connectorName === 'sqlite') {
    await db.sql`CREATE TABLE IF NOT EXISTS users (...)`
  }
  if (connectorName === 'mysql') {
    await db.sql`CREATE TABLE IF NOT EXISTS users (...)`
  }
}
```

### CLI Integration

Each migration can be run as a CLI command:

```ts
// Run if this is the main module
if (process.argv[1] && process.argv[1].endsWith('create-users-table.ts')) {
  migrateDefault()
}
```

## Database Support

### SQLite Migrations

SQLite migrations use SQLite-specific syntax:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### MySQL Migrations

MySQL migrations use MySQL-specific syntax:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### PostgreSQL Migrations

PostgreSQL migrations use PostgreSQL-specific syntax:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Error Handling

### Migration Failures

If a migration fails:

1. **Error is logged**: Detailed error information is displayed
2. **Process exits**: The migration process stops
3. **No partial state**: Failed migrations are not marked as applied
4. **Manual recovery**: You may need to manually fix the issue

### Common Issues

1. **Permission denied**: Ensure database directory is writable
2. **Table already exists**: The system handles this gracefully
3. **Connection failed**: Check database credentials
4. **Syntax errors**: Database-specific SQL syntax issues

## Monitoring Migrations

### Check Migration Status

You can check which migrations have been applied:

```ts
const appliedMigrations = await getAppliedMigrations(options)
console.log('Applied migrations:', appliedMigrations)
```

### Migration Warnings

The module warns about missing migrations during startup:

```
[Nuxt Users DB] ⚠️  Missing migrations: create_users_table, create_personal_access_tokens_table
[Nuxt Users DB] ⚠️  Run migrations with: yarn db:migrate
```

## Future Enhancements

### Planned Features

- **Rollback support**: Ability to undo migrations
- **Migration generation**: CLI to generate new migration files
- **Schema validation**: Verify database schema matches expectations
- **Migration testing**: Test migrations before applying

### Custom Migrations

Future versions may support custom user migrations:

```ts
// Example future API
export default defineNuxtConfig({
  nuxtUsers: {
    migrations: {
      custom: [
        'path/to/custom/migration.ts'
      ]
    }
  }
})
```

## Best Practices

### Development

1. **Always run migrations**: Use `yarn db:migrate` in development
2. **Test migrations**: Verify migrations work with both databases
3. **Backup data**: Backup production data before running migrations
4. **Monitor logs**: Check for migration warnings and errors

### Production

1. **Test in staging**: Run migrations in staging environment first
2. **Backup database**: Always backup before running migrations
3. **Monitor performance**: Large migrations may impact performance
4. **Rollback plan**: Have a plan to rollback if needed

## Next Steps

- [Database Schema](/database/schema) - Understand the database structure
- [CLI Commands](/database/cli-commands) - Database management commands
- [Database Setup](/guide/database-setup) - Learn how to set up your database 