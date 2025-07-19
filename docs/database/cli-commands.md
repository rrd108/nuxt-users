# CLI Commands

The Nuxt Users module provides several CLI commands for database management and user creation. These commands are available when you install this module as a dependency in your Nuxt project.

## Prerequisites

Before running any CLI commands, make sure you have:

1. Installed the module in your project: `npm install nuxt-users`
2. Set up your database configuration
3. Have the required dependencies installed (`db0`, `better-sqlite3`, `mysql2`, `pg`)

## Available Commands

### Database Migration

#### Run All Migrations (Recommended)

```bash
npx nuxt-users migrate
```

This command will:
- Create the migrations table if it doesn't exist
- Run all pending migrations in the correct order
- Create all necessary tables (users, personal_access_tokens, password_reset_tokens)

#### Individual Table Creation

You can also create tables individually:

```bash
# Create migrations tracking table
npx nuxt-users create-migrations-table

# Create users table
npx nuxt-users create-users-table

# Create personal access tokens table
npx nuxt-users create-personal-access-tokens-table

# Create password reset tokens table
npx nuxt-users create-password-reset-tokens-table
```

### User Management

#### Create a New User

```bash
npx nuxt-users create-user <email> <name> <password>
```

Example:
```bash
npx nuxt-users create-user john@example.com "John Doe" mypassword123
```

### Using Package.json Scripts

For convenience, you can add these commands to your project's `package.json` scripts:

```json
{
  "scripts": {
    "db:migrate": "nuxt-users migrate",
    "db:create-user": "nuxt-users create-user",
    "db:create-migrations-table": "nuxt-users create-migrations-table",
    "db:create-users-table": "nuxt-users create-users-table",
    "db:create-personal-access-tokens-table": "nuxt-users create-personal-access-tokens-table",
    "db:create-password-reset-tokens-table": "nuxt-users create-password-reset-tokens-table"
  }
}
```

Then you can run:

```bash
yarn db:migrate
yarn db:create-user admin@example.com "Admin User" mypassword123
npm run db:migrate
npm run db:create-user admin@example.com "Admin User" mypassword123
```

## Database Configuration

The CLI commands use environment variables to determine database configuration. You can set these in your shell or in a `.env` file.

### SQLite (Default)

```bash
export DB_CONNECTOR=sqlite
export DB_PATH=./data/myapp.sqlite3
```

### MySQL

```bash
export DB_CONNECTOR=mysql
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=your_database
```

### PostgreSQL

```bash
export DB_CONNECTOR=postgresql
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_NAME=your_database
```

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_CONNECTOR` | Database type: `sqlite`, `mysql`, or `postgresql` | `sqlite` | No |
| `DB_PATH` | SQLite database file path | `./data/default.sqlite3` | For SQLite |
| `DB_HOST` | Database host | `localhost` | For MySQL/PostgreSQL |
| `DB_PORT` | Database port | `3306` (MySQL) / `5432` (PostgreSQL) | For MySQL/PostgreSQL |
| `DB_USER` | Database username | `root` (MySQL) / `postgres` (PostgreSQL) | For MySQL/PostgreSQL |
| `DB_PASSWORD` | Database password | Empty string | For MySQL/PostgreSQL |
| `DB_NAME` | Database name | `nuxt_users` | For MySQL/PostgreSQL |

## Troubleshooting

### Common Issues

#### 1. "Command not found" Error

If you get a "Command not found" error when using `npx nuxt-users`, make sure:

1. The module is properly installed: `npm install nuxt-users`
2. You're running the command from your project root directory
3. The module is listed in your `package.json` dependencies

If you're using the package.json scripts approach, make sure you've added the scripts to your `package.json` file.

#### 2. MySQL Connection Issues

If you're having trouble connecting to MySQL:

1. Ensure MySQL is running
2. Verify your connection credentials
3. Make sure the database exists
4. Check that the user has proper permissions

#### 3. PostgreSQL Connection Issues

If you're having trouble connecting to PostgreSQL:

1. Ensure PostgreSQL is running
2. Verify your connection credentials
3. Make sure the database exists
4. Check that the user has proper permissions

#### 4. Permission Denied Errors

For SQLite, ensure the directory where you're creating the database file is writable:

```bash
mkdir -p ./data
chmod 755 ./data
```

### Debug Mode

To see more detailed output, you can run commands with verbose logging:

```bash
DEBUG=* npx nuxt-users migrate
```

## Examples

### Complete Setup with SQLite

```bash
# Set up SQLite (default)
export DB_CONNECTOR=sqlite
export DB_PATH=./data/myapp.sqlite3

# Run migrations
npx nuxt-users migrate

# Create a user
npx nuxt-users create-user admin@example.com "Admin User" admin123
```

### Complete Setup with MySQL

```bash
# Set up MySQL
export DB_CONNECTOR=mysql
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=myapp

# Run migrations
npx nuxt-users migrate

# Create a user
npx nuxt-users create-user admin@example.com "Admin User" admin123
```

### Complete Setup with PostgreSQL

```bash
# Set up PostgreSQL
export DB_CONNECTOR=postgresql
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_NAME=myapp

# Run migrations
npx nuxt-users migrate

# Create a user
npx nuxt-users create-user admin@example.com "Admin User" admin123
```

### Using Package.json Scripts (Alternative)

You can also add these to your `package.json` scripts for convenience:

```json
{
  "scripts": {
    "db:migrate": "nuxt-users migrate",
    "db:create-user": "nuxt-users create-user"
  }
}
```

Then run:
```bash
yarn db:migrate
yarn db:create-user admin@example.com "Admin User" admin123
```

## Integration with CI/CD

For continuous integration, you can set environment variables in your CI configuration:

```yaml
# Example for GitHub Actions
env:
  DB_CONNECTOR: mysql
  DB_HOST: localhost
  DB_PORT: 3306
  DB_USER: root
  DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
  DB_NAME: test_db
```

## Security Notes

- Never commit database passwords to version control
- Use environment variables for sensitive configuration
- Consider using a secrets management service in production
- Regularly rotate database passwords
- Use strong passwords for database users 