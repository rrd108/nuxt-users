# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nuxt Users is a comprehensive user management module for Nuxt applications with authentication, authorization, database support (SQLite, MySQL, PostgreSQL), and CLI tools. The module provides user authentication with bcrypt password hashing, password reset functionality, and includes pre-built Vue components.

## Development Environment Setup

**Node.js v22 is required** for development, testing, and deployment. The project uses scripts to enforce this requirement.

```bash
# Install dependencies
yarn install

# Prepare development environment
yarn dev:prepare

# Start development server (playground app)
yarn dev

# Start documentation server
yarn docs:dev
```

## Build and Release Commands

```bash
# Build the module
yarn build

# Run full release process (lint, test, build, publish)
yarn release

# Prepare for development (build stubs and prepare playground)
yarn dev:prepare
```

## Testing Commands

The project has comprehensive test coverage across multiple database types:

```bash
# Run all tests (types, SQLite, MySQL, PostgreSQL)
yarn test

# Test specific database types
yarn test:sqlite
yarn test:mysql
yarn test:postgresql

# Run tests in watch mode
yarn test:watch

# Type checking
yarn test:types
```

Database tests use shell scripts (`scripts/test-*.sh`) that automatically set up environment variables and wait for database readiness with retry logic.

## Linting and Code Quality

```bash
# Check code style
yarn lint

# Fix linting issues
yarn lint:fix
```

ESLint configuration enforces:
- Single quotes (with escape avoidance)
- No trailing commas
- Specific stylistic rules via `@nuxt/eslint-config`

## CLI Commands

The module includes a CLI tool with database management commands:

```bash
# Migration and setup
yarn db:migrate
yarn db:create-users-table
yarn db:create-migrations-table
yarn db:create-personal-access-tokens-table
yarn db:create-password-reset-tokens-table

# User management
yarn db:create-user

# Using the built CLI directly
npx nuxt-users migrate
npx nuxt-users create-user user@example.com "John Doe" password123
```

## Architecture Overview

### Module Structure
- **`src/module.ts`**: Main Nuxt module definition with runtime config and component registration
- **`src/types.ts`**: TypeScript interfaces for ModuleOptions, User, database configs, and mailer options
- **`src/utils/`**: Database utilities, user management, and shared functions
- **`src/cli/`**: CLI commands for database operations using `citty`
- **`src/runtime/`**: Runtime code including server API routes, Vue components, and plugins

### Database Layer
- **Database abstraction**: Uses `db0` with connectors for SQLite (`better-sqlite3`), MySQL (`mysql2`), PostgreSQL (`pg`)
- **Dynamic imports**: Database connectors are loaded dynamically with helpful error messages for missing dependencies
- **Connection handling**: `src/utils/db.ts` provides `useDb()` and `getConnector()` functions
- **Table management**: Utilities for checking table existence and managing database schema

### API Routes
- **`/api/nuxt-users/session`**: POST login, DELETE logout
- **`/api/nuxt-users/password/forgot`**: POST password reset initiation
- **`/api/nuxt-users/password/reset`**: POST password reset completion

### Vue Components
- **NUsersLoginForm**: User authentication and forgot password form
- **NUsersResetPasswordForm**: Password reset completion form

All components are auto-registered via the Nuxt module.

### Authentication System
- **Password hashing**: Uses bcrypt for secure password storage
- **Token management**: Generates secure tokens stored in `personal_access_tokens` table
- **Cookie handling**: Sets HTTP-only cookies for authentication tokens
- **Password reset**: Email-based password reset with secure token generation

## Database Configuration

Default configuration uses SQLite, but supports multiple databases:

```typescript
// SQLite (default)
nuxtUsers: {
  connector: {
    name: 'sqlite',
    options: { path: './data/users.sqlite3' }
  }
}

// MySQL
nuxtUsers: {
  connector: {
    name: 'mysql',
    options: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'password',
      database: 'myapp'
    }
  }
}
```

### Database Tables
- **`migrations`**: Track database schema changes
- **`users`**: Store user accounts with bcrypt-hashed passwords
- **`personal_access_tokens`**: Store authentication tokens  
- **`password_reset_tokens`**: Store password reset tokens

Table names are configurable via module options.

## Testing Database Setup

### MySQL Testing
Default credentials: `root:123@localhost:3306/test_db`
```bash
# Docker setup for MySQL testing
docker run --name mysql-test -e MYSQL_ROOT_PASSWORD=123 -e MYSQL_DATABASE=test_db -p 3306:3306 -d mysql:5.7
yarn test:mysql
```

### PostgreSQL Testing  
Default credentials: `postgres:123@localhost:5432/test_db`
```bash
# Docker setup for PostgreSQL testing
docker run --name postgres-test -e POSTGRES_PASSWORD=123 -e POSTGRES_DB=test_db -p 5432:5432 -d postgres:13
yarn test:postgresql
```

## Build Configuration

Uses `unbuild` with multiple entry points:
- **Module**: Main Nuxt module (`src/module`)
- **Utils**: Exportable utilities (`src/utils/index`)  
- **CLI**: Command-line interface (`src/cli/main`)

External dependencies include database connectors, bcrypt, and nodemailer.

## Documentation

VitePress-powered documentation in `/docs` directory:
```bash
# Development
yarn docs:dev

# Build and deploy
yarn docs:build
yarn docs:deploy
```

## Development Workflow

1. Use `yarn dev:prepare` to set up the development environment
2. Run `yarn dev` to start the playground application for testing
3. Write tests for new features with appropriate database setup
4. Run `yarn lint` before committing changes
5. Use `yarn test` to run full test suite across all database types
6. Follow the single-quote, no-trailing-comma code style enforced by ESLint

## Key Files for Development

- **Module entry**: `src/module.ts:32` (defineNuxtModule setup)
- **Database utilities**: `src/utils/db.ts:28` (useDb function)
- **CLI entry**: `src/cli/main.ts:11` (command definitions)
- **Type definitions**: `src/types.ts:11` (ModuleOptions interface)
- **Login API**: `src/runtime/server/api/nuxt-users/session/index.post.ts:8` (authentication handler)

## Documentation Mapping

When making changes to these code areas, consider updating the corresponding documentation:

| Code Area | Documentation Files | Notes |
|-----------|-------------------|-------|
| `src/cli/` | `docs/database/cli-commands.md` | CLI commands, configuration loading, environment variables |
| `src/types.ts` | `docs/guide/configuration.md`, `docs/database/schema.md` | ModuleOptions interface, database types |
| `src/runtime/server/api/` | `docs/guide/authentication.md` | API endpoints, authentication flow |
| `src/runtime/components/` | `docs/components/index.md` | Vue component props and usage |
| `src/module.ts` | `docs/guide/installation.md`, `docs/guide/configuration.md` | Module registration, default options |
| `src/utils/db.ts` | `docs/database/migrations.md`, `docs/guide/database-setup.md` | Database connectors, connection handling |
| Database migrations | `docs/database/migrations.md`, `docs/database/schema.md` | Table structure, migration process |
| Test files | `docs/contributing/running-tests.md` | Testing setup, database configurations |
| Build configuration | `docs/contributing/development-setup.md` | Build process, external dependencies |