# Running Tests

Learn how to run and write tests for the Nuxt Users module.

## Test Overview

The project includes comprehensive tests for both SQLite and MySQL databases:

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

The project includes CI configuration that:

1. Runs tests against both SQLite and MySQL
2. Checks TypeScript types
3. Runs linting
4. Builds the module
5. Builds documentation

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
2. **Wrong credentials**: Check environment variables
3. **Permission denied**: Ensure database user has proper permissions

### Test Failures

1. **Clean database**: Tests may fail if database has existing data
2. **Port conflicts**: Ensure MySQL port 3306 is available
3. **File permissions**: Ensure test database files are writable

## Next Steps

- [Development Setup](/contributing/development-setup) - Set up your development environment
- [Guidelines](/contributing/guidelines) - Understand contribution guidelines
- [Code Style](/contributing/code-style) - Follow the project's coding standards 