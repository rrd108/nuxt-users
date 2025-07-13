# Database Setup

Learn how to set up and configure your database for Nuxt Users.

## Quick Setup

The easiest way to set up your database is to run all migrations at once:

```bash
yarn db:migrate
```

This will create all necessary tables in the correct order.

## Manual Setup

You can also run table creation commands individually:

### 1. Create Users Table

```bash
yarn db:create-users-table
```

### 2. Create Personal Access Tokens Table

This table is required for storing authentication tokens.

```bash
yarn db:create-personal-access-tokens-table
```

### 3. Create Password Reset Tokens Table

This table is required for storing tokens used in the password reset flow.

```bash
yarn db:create-password-reset-tokens-table
```

### 4. Create Your First User

```bash
yarn db:create-user user@example.com "John Doe" password123
```

## Database Connectors

### SQLite (Default)

SQLite is the default database and requires no additional setup:

```ts
nuxtUsers: {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/default.sqlite3'
    }
  }
}
```

### MySQL

For MySQL, you need a running MySQL instance:

```ts
nuxtUsers: {
  connector: {
    name: 'mysql',
    options: {
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'myapp'
    }
  }
}
```

### PostgreSQL

For PostgreSQL, you need a running PostgreSQL instance:

```ts
nuxtUsers: {
  connector: {
    name: 'postgresql',
    options: {
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'myapp'
    }
  }
}
```

## Migration System

The module includes a migration system that tracks which database changes have been applied. This ensures that:

- Migrations are only run once
- Database schema is consistent across environments
- Future database changes can be safely applied

The migration system creates a `migrations` table that tracks all applied migrations. When you run `yarn db:migrate`, it will:

1. Create the migrations table if it doesn't exist
2. Check which migrations have already been applied
3. Run only the pending migrations
4. Mark each migration as applied after successful execution

## CLI Commands

| Command | Description |
|---------|-------------|
| `yarn db:migrate` | Run all pending migrations (recommended) |
| `yarn db:create-users-table` | Create the users table |
| `yarn db:create-personal-access-tokens-table` | Create the personal access tokens table |
| `yarn db:create-password-reset-tokens-table` | Create the password reset tokens table |
| `yarn db:create-migrations-table` | Create the migrations tracking table |
| `yarn db:create-user <email> <name> <password>` | Create a new user |

## Environment Variables

For production, consider using environment variables:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    connector: {
      name: process.env.DB_TYPE || 'sqlite',
      options: process.env.DB_TYPE === 'mysql' ? {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      } : process.env.DB_TYPE === 'postgresql' ? {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      } : {
        path: process.env.DB_PATH || './data/default.sqlite3'
      }
    }
  }
})
```

## PostgreSQL Setup

### Prerequisites

1. **Install PostgreSQL**: Make sure PostgreSQL is installed and running
2. **Create Database**: Create a database for your application
3. **Configure Connection**: Update your configuration with PostgreSQL credentials

### Quick Setup with Docker

```bash
# Start PostgreSQL container
docker run --name postgres-test \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  -d postgres:13

# Test connection
psql -h localhost -p 5432 -U postgres -d myapp
```

### Environment Variables for PostgreSQL

```bash
export DB_TYPE=postgresql
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=myapp
```

### Testing PostgreSQL

The module includes a PostgreSQL test script:

```bash
# Run PostgreSQL tests
yarn test:postgresql
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the database directory is writable (SQLite)
2. **Connection Failed**: Check database credentials and network connectivity
3. **Table Already Exists**: The migration system handles this automatically
4. **PostgreSQL Connection**: Ensure PostgreSQL service is running and accessible

### Verification

To verify your database setup:

```bash
# Check if tables exist
yarn db:migrate

# Create a test user
yarn db:create-user test@example.com "Test User" password123

# Check the database file (SQLite)
ls -la data/

# For PostgreSQL, connect and check tables
psql -h localhost -p 5432 -U postgres -d myapp -c "\dt"
```

## Next Steps

- [Database Schema](/database/schema) - Understand the database structure
- [Migrations](/database/migrations) - Learn about the migration system
- [CLI Commands](/database/cli-commands) - Database management commands 