# Running Tests

Learn how to run and write tests for the Nuxt Users module.

## Test Overview

The project includes comprehensive tests for SQLite, MySQL, and PostgreSQL databases:

- **Unit tests**: Individual function testing
- **Integration tests**: API endpoint testing
- **CLI tests**: Database command testing
- **Component tests**: Vue component testing

## Quick Start

```bash
# Run all tests (SQLite + MySQL)
yarn test

# Run tests in watch mode
yarn test:watch
```

## Database-Specific Tests

The project uses shell scripts to set up the proper environment for each database type before running tests.

### SQLite Tests

```bash
# Run tests against SQLite only
yarn test:sqlite

# Run specific test files
yarn test:sqlite test/basic.test.ts
yarn test:sqlite test/login.test.ts

# Run tests matching a pattern
yarn test:sqlite -- --grep "database"
```

### MySQL Tests

```bash
# Run tests against MySQL only
yarn test:mysql

# Run specific test files
yarn test:mysql test/login.test.ts

# Run tests matching a pattern
yarn test:mysql -- --grep "authentication"
```

The MySQL test script (`scripts/test-mysql.sh`) automatically:
- Sets up environment variables for MySQL
- Waits for MySQL to be ready (with retry logic)
- Creates the test database if it doesn't exist
- Handles authentication with `MYSQL_PWD` environment variable

### PostgreSQL Tests

```bash
# Run tests against PostgreSQL only
yarn test:postgresql

# Run specific test files
yarn test:postgresql test/login.test.ts

# Run tests matching a pattern
yarn test:postgresql -- --grep "authentication"
```

The PostgreSQL test script (`scripts/test-postgresql.sh`) automatically:
- Sets up environment variables for PostgreSQL
- Waits for PostgreSQL to be ready (with retry logic)
- Creates the test database if it doesn't exist
- Uses `PGPASSWORD` for authentication

## Test Scripts

The project includes shell scripts in the `scripts/` directory that handle database setup and test execution:

### `scripts/test-sqlite.sh`
- Sets `DB_CONNECTOR=sqlite` environment variable
- Runs tests against SQLite database
- No additional setup required

### `scripts/test-mysql.sh`
- Sets up MySQL environment variables
- Waits for MySQL connection with retry logic (up to 10 attempts)
- Creates test database if it doesn't exist
- Sets `MYSQL_PWD` for authentication
- Provides helpful error messages if MySQL is not accessible

### `scripts/test-postgresql.sh`
- Sets up PostgreSQL environment variables
- Waits for PostgreSQL connection with retry logic (up to 10 attempts)
- Creates test database if it doesn't exist
- Uses `PGPASSWORD` for authentication
- Provides helpful error messages if PostgreSQL is not accessible

## Test Files Overview

| File | Description |
|------|-------------|
| `test/basic.test.ts` | Basic module functionality and setup |
| `test/login.test.ts` | Login API endpoint and authentication flow |
| `test/cli.*.test.ts` | CLI command tests (table creation, user creation) |
| `test/utils.db.test.ts` | Database utility function tests |
| `test/utils.user.test.ts` | User management utility tests |

## MySQL Testing Requirements

For MySQL tests, you need a running MySQL instance. The tests use these default credentials:

- **Host**: `localhost`
- **Port**: `3306`
- **User**: `root`
- **Password**: `123`
- **Database**: `test_db`

### Environment Variables

You can override these with environment variables:

```bash
export DB_CONNECTOR=mysql
export DB_HOST=your-mysql-host
export DB_PORT=3306
export DB_USER=your-user
export DB_PASSWORD=your-password
export DB_NAME=your-test-db
```

### Quick MySQL Setup with Docker

```bash
# Start MySQL container for testing
docker run --name mysql-test \
  -e MYSQL_ROOT_PASSWORD=123 \
  -e MYSQL_DATABASE=test_db \
  -p 3306:3306 \
  -d mysql:5.7

# Run MySQL tests
yarn test:mysql

# Clean up
docker stop mysql-test
docker rm mysql-test
```

## PostgreSQL Testing Requirements

For PostgreSQL tests, you need a running PostgreSQL instance. The tests use these default credentials:

- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `123`
- **Database**: `test_db`

### Environment Variables

You can override these with environment variables:

```bash
export DB_CONNECTOR=postgresql
export DB_HOST=your-postgresql-host
export DB_PORT=5432
export DB_USER=your-user
export DB_PASSWORD=your-password
export DB_NAME=your-test-db
```

### Quick PostgreSQL Setup with Docker

```bash
# Start PostgreSQL container for testing
docker run --name postgres-test \
  -e POSTGRES_PASSWORD=123 \
  -e POSTGRES_DB=test_db \
  -p 5432:5432 \
  -d postgres:13

# Run PostgreSQL tests
yarn test:postgresql

# Clean up
docker stop postgres-test
docker rm postgres-test
```

## Writing Tests

### Test Structure

Tests use Vitest and follow this structure:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Feature Name', () => {
  beforeEach(async () => {
    // Setup before each test
  })

  afterEach(async () => {
    // Cleanup after each test
  })

  it('should do something', async () => {
    // Test implementation
    expect(result).toBe(expected)
  })
})
```

### Database Test Setup

```ts
import { createTestSetup } from './test-setup'

describe('Database Tests', () => {
  let db: Database
  let testOptions: ModuleOptions

  beforeEach(async () => {
    const settings = await createTestSetup({
      dbType: 'sqlite',
      dbConfig: { path: './_test-db' }
    })

    db = settings.db
    testOptions = settings.testOptions
  })

  afterEach(async () => {
    // Cleanup test database
  })
})
```

### API Test Example

```ts
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Login API', () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/login', import.meta.url))
  })

  it('should login successfully', async () => {
    const response = await $fetch('/api/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    })

    expect(response.user).toBeDefined()
    expect(response.user.email).toBe('test@example.com')
  })
})
```

## Test Utilities

### Test Setup

The `test/test-setup.ts` file provides utilities for:

- Creating test database connections
- Setting up test configurations
- Cleaning up test data

```ts
import { createTestSetup, cleanupTestSetup } from './test-setup'

const settings = await createTestSetup({
  dbType: 'sqlite',
  dbConfig: { path: './_test-db' }
})

// Use settings.db and settings.testOptions
await cleanupTestSetup(dbType, db, paths, tables)
```

### Database Utilities

```ts
import { getConnector, checkUsersTableExists } from '../src/runtime/server/utils/db'

// Test database connector
const connector = await getConnector('sqlite')

// Check if table exists
const exists = await checkUsersTableExists(options)
```

## Code Quality Tests

### Type Checking

```bash
# Check TypeScript types
yarn test:types
```

### Linting

```bash
# Check code style
yarn lint

# Auto-fix linting issues
yarn lint --fix
```

## Continuous Integration

The project includes CI configuration (`.github/workflows/ci.yml`) that:

1. **Runs tests against all databases**:
   - SQLite (no additional setup required)
   - MySQL (with MariaDB 10.5 service and health checks)
   - PostgreSQL (with PostgreSQL 13 service and health checks)

2. **Database setup in CI**:
   - Installs database clients (`mariadb-client`, `postgresql-client`)
   - Uses health checks to ensure databases are ready before testing
   - Sets up proper environment variables for each database type

3. **Additional checks**:
   - Checks TypeScript types
   - Runs linting
   - Builds the module
   - Builds documentation

The CI workflow automatically handles database setup and teardown, making it easy to run tests in a clean environment.

## Debugging Tests

### Verbose Output

```bash
# Run tests with verbose output
yarn test:sqlite -- --reporter=verbose
```

### Debug Mode

```bash
# Run tests in debug mode
yarn test:sqlite -- --inspect-brk
```

### Single Test

```bash
# Run a single test
yarn test:sqlite -- --grep "specific test name"
```

## Test Coverage

To check test coverage:

```bash
# Run tests with coverage
yarn test:sqlite -- --coverage
```

## Common Issues

### Database Connection Issues

1. **MySQL not running**: Start MySQL service or Docker container
2. **PostgreSQL not running**: Start PostgreSQL service or Docker container
3. **Wrong credentials**: Check environment variables
4. **Permission denied**: Ensure database user has proper permissions

### Test Failures

1. **Clean database**: Tests may fail if database has existing data
2. **Port conflicts**: Ensure MySQL port 3306 and PostgreSQL port 5432 are available
3. **File permissions**: Ensure test database files are writable

## Next Steps

- [Development Setup](/contributing/development-setup) - Set up your development environment
- [Guidelines](/contributing/guidelines) - Understand contribution guidelines
- [Code Style](/contributing/code-style) - Follow the project's coding standards 