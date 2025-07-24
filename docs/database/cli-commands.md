# CLI Commands

The Nuxt Users module provides a powerful Command Line Interface (CLI) for managing users, database operations, and project information. All commands are built using [citty](https://github.com/unjs/citty) for a modern and user-friendly experience.

## Installation

The CLI is automatically available when you install the `nuxt-users` module. You can run commands using:

```bash
npx nuxt-users <command>
```

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

**Arguments:**
- `email`: User's email address (required)
- `name`: User's full name (required)
- `password`: User's password (required)

**Example:**
```bash
npx nuxt-users create-user john@example.com "John Doe" mypassword123
```

### `project-info`
Get detailed information about the Nuxt project and module configuration.

```bash
npx nuxt-users project-info
```

This command will display:
- Nuxt project information
- Module configuration
- Database connector settings
- Table existence status
- Runtime configuration details

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

The CLI commands determine database configuration using the following priority:

1. **Nuxt project configuration** - If running from a Nuxt project, the CLI will first attempt to load configuration from `nuxt.config.ts` under the `nuxtUsers` module options
2. **Environment variables** - If no Nuxt configuration is found, the CLI falls back to environment variables

You can set environment variables in your shell or in a `.env` file.

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

## Getting Help

To see all available commands and their descriptions:

```bash
npx nuxt-users --help
```

To get help for a specific command:

```bash
npx nuxt-users <command> --help
```

## Error Handling

All CLI commands provide clear error messages and appropriate exit codes:

- **Exit code 0**: Success
- **Exit code 1**: Error occurred

Common error scenarios:
- Database connection failures
- Missing environment variables
- Invalid command arguments
- Table already exists (for creation commands)

## Integration with Nuxt Context

The `project-info` command demonstrates how CLI commands can access the Nuxt instance using `@nuxt/kit`. This allows commands to:

- Read project configuration
- Access runtime config
- Check module settings
- Validate project structure

## Development

The CLI commands are located in the `src/cli/` directory. Each command is a TypeScript file that exports a citty command definition.

To add a new command:

1. Create a new file in `src/cli/`
2. Export a citty command using `defineCommand`
3. Import and register it in `src/cli/main.ts`
4. Rebuild the CLI using `npm run build:cli`

## Build Process

The CLI is built using [unbuild](https://github.com/unjs/unbuild) and configured in `package.json`:

```json
{
  "unbuild": {
    "entries": [
      "./src/module",
      {
        "builder": "rollup",
        "input": "./src/cli/main",
        "name": "cli",
        "ext": "mjs"
      }
    ],
    "declaration": true,
    "clean": true
  }
}
```

The compiled CLI is available at `./dist/cli.mjs` and exposed via the `bin` field in `package.json`.

## Security Notes

- Never commit database passwords to version control
- Use environment variables for sensitive configuration
- Consider using a secrets management service in production
- Regularly rotate database passwords
- Use strong passwords for database users 