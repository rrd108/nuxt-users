# Testing

Learn how to run and write tests for the Nuxt Users module. This guide covers the comprehensive test suite that validates functionality across SQLite, MySQL, and PostgreSQL databases.

## Test Overview

The project includes comprehensive tests organized into several categories:

- **Unit tests**: Individual function testing (database-independent)
- **Integration tests**: API endpoint testing with real databases
- **CLI tests**: Database command and migration testing
- **Component tests**: Vue component testing

## Quick Start

```bash
# Run all tests (SQLite + MySQL + PostgreSQL + Unit tests)
yarn test

# Run tests in watch mode
yarn test:watch

# Run only unit tests (no database required)
yarn test:unit
```

## Test Structure

### Test Organization

```
test/
├── cli/                    # CLI command tests
├── fixtures/               # Test fixtures and setup
├── unit/                   # Database-independent unit tests
├── database-sharing.test.ts
├── login.test.ts
├── logout.test.ts
├── test-setup.ts          # Test utilities and setup
├── utils.db.test.ts
└── utils.user.test.ts
```

### Test Categories

| Category | Files | Purpose |
|----------|-------|---------|
| **Unit Tests** | `test/unit/*.test.ts` | Test individual functions without database |
| **Integration Tests** | `test/*.test.ts` | Test API endpoints with real databases |
| **CLI Tests** | `test/cli/*.test.ts` | Test CLI commands and migrations |
| **Component Tests** | Vue component testing | Test Vue components |

## Database-Specific Testing

The project uses shell scripts to set up the proper environment for each database type before running tests.

### SQLite Tests

```bash
# Run tests against SQLite only
yarn test:sqlite

# Run specific test files
yarn test:sqlite test/login.test.ts
yarn test:sqlite test/utils.user.test.ts

# Run tests matching a pattern
yarn test:sqlite -- --grep "authentication"
```

SQLite tests are the fastest and require no additional setup. The test script automatically:
- Sets `DB_CONNECTOR=sqlite` environment variable
- Uses temporary database files for isolation
- Cleans up test files after completion

### MySQL Tests

```bash
# Run tests against MySQL only
yarn test:mysql

# Run specific test files
yarn test:mysql test/login.test.ts

# Run tests matching a pattern
yarn test:mysql -- --grep "user management"
```

The MySQL test script (`scripts/test-mysql.sh`) automatically:
- Sets up environment variables for MySQL connection
- Waits for MySQL to be ready (with retry logic up to 10 attempts)
- Creates the test database if it doesn't exist
- Uses `MYSQL_PWD` environment variable for authentication
- Provides helpful error messages if MySQL is not accessible

**Default MySQL Configuration:**
- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: `123`
- Database: `test_db`

### PostgreSQL Tests

```bash
# Run tests against PostgreSQL only
yarn test:postgresql

# Run specific test files
yarn test:postgresql test/login.test.ts

# Run tests matching a pattern
yarn test:postgresql -- --grep "authorization"
```

The PostgreSQL test script (`scripts/test-postgresql.sh`) automatically:
- Sets up environment variables for PostgreSQL connection
- Waits for PostgreSQL to be ready using `pg_isready`
- Recreates the test database for clean state
- Configures PostgreSQL settings for testing (connection limits, logging)
- Cleans up idle connections
- Uses `PGPASSWORD` for authentication

**Default PostgreSQL Configuration:**
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `123`
- Database: `test_db`

## Database Setup for Testing

### MySQL Setup with Docker

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

### PostgreSQL Setup with Docker

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

### Environment Variables

You can override default database configurations with environment variables:

```bash
# MySQL
export DB_CONNECTOR=mysql
export DB_HOST=your-mysql-host
export DB_PORT=3306
export DB_USER=your-user
export DB_PASSWORD=your-password
export DB_NAME=your-test-db

# PostgreSQL
export DB_CONNECTOR=postgresql
export DB_HOST=your-postgresql-host
export DB_PORT=5432
export DB_USER=your-user
export DB_PASSWORD=your-password
export DB_NAME=your-test-db
```

## Writing Tests

### Test Structure with Vitest

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

Use the test setup utilities for database tests:

```ts
import { createTestSetup, cleanupTestSetup } from './test-setup'
import type { Database } from 'db0'
import type { ModuleOptions, DatabaseType, DatabaseConfig } from '../src/types'

describe('Database Tests', () => {
  let db: Database
  let testOptions: ModuleOptions
  let dbType: DatabaseType
  let dbConfig: DatabaseConfig

  beforeEach(async () => {
    dbType = process.env.DB_CONNECTOR as DatabaseType || 'sqlite'
    
    if (dbType === 'sqlite') {
      dbConfig = { path: './_test-db' }
    }
    // ... other database configurations

    const settings = await createTestSetup({
      dbType,
      dbConfig,
    })

    db = settings.db
    testOptions = settings.testOptions

    // Create necessary tables
    await createUsersTable(testOptions)
  })

  afterEach(async () => {
    await cleanupTestSetup(dbType, db, [testOptions.connector!.options.path!], testOptions.tables.users)
  })
})
```

### API Test Example

```ts
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'

describe('Login API', () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/login_logout', import.meta.url))
  })

  it('should login successfully', async () => {
    const response = await $fetch('/api/nuxt-users/session', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    })

    expect(response.user).toBeDefined()
    expect(response.user.email).toBe('test@example.com')
  })

  it('should return 401 for invalid credentials', async () => {
    try {
      await $fetch('/api/nuxt-users/session', {
        method: 'POST',
        body: {
          email: 'wrong@example.com',
          password: 'wrongpassword'
        }
      })
    } catch (error: unknown) {
      const fetchError = error as { response: { status: number, _data: { statusMessage: string } } }
      expect(fetchError.response.status).toBe(401)
      expect(fetchError.response._data.statusMessage).toBe('Invalid email or password')
    }
  })
})
```

### Unit Test Example (Mocked)

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock external dependencies
vi.mock('h3', () => ({
  defineEventHandler: vi.fn(handler => handler),
  readBody: vi.fn(),
  createError: vi.fn()
}))

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn()
}))

describe('User API Routes', () => {
  let mockReadBody: ReturnType<typeof vi.fn>
  let mockCreateError: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    
    const h3 = await import('h3')
    mockReadBody = h3.readBody as ReturnType<typeof vi.fn>
    mockCreateError = h3.createError as ReturnType<typeof vi.fn>
  })

  it('should create a user successfully', async () => {
    const newUser = { email: 'new@example.com', name: 'New User', password: 'password123' }
    mockReadBody.mockResolvedValue(newUser)

    // Test implementation
    expect(mockReadBody).toHaveBeenCalled()
  })
})
```

## Test Utilities

### Test Setup Utilities

The `test/test-setup.ts` file provides utilities for:

```ts
// Create test database connection and configuration
const settings = await createTestSetup({
  dbType: 'sqlite',
  dbConfig: { path: './_test-db' },
  tableName: 'users',
  cleanupFiles: ['./_test-db']
})

// Get test options for different database types
const testOptions = getTestOptions(dbType, dbConfig)

// Get database configuration
const dbConfig = getDatabaseConfig('mysql')

// Cleanup after tests
await cleanupTestSetup(dbType, db, cleanupFiles, tableName)
```

### Understanding Code Behavior Through Tests

Tests serve as living documentation of how the code should behave. When contributing to the project:

1. **Read existing tests** to understand expected behavior
2. **Run tests** to see current functionality in action
3. **Write tests first** when adding new features (TDD approach)
4. **Use test failures** to understand what needs to be implemented

For example, the login test shows exactly how authentication should work:
- What request format is expected
- What response format is returned
- How errors are handled
- What database operations occur

## Vitest Configuration

The project uses a custom Vitest configuration:

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    fileParallelism: false, // Run test files sequentially to avoid database conflicts
  },
})
```

This configuration ensures that database tests don't interfere with each other by running sequentially.

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
# Run a single test file
yarn test:sqlite test/login.test.ts

# Run tests matching a pattern
yarn test:sqlite -- --grep "should login successfully"
```

### Test Coverage

```bash
# Run tests with coverage
yarn test:sqlite -- --coverage
```

## Continuous Integration

The project includes CI configuration that:

1. **Runs tests against all databases**:
   - SQLite (no additional setup required)
   - MySQL (with MariaDB 10.5 service and health checks)
   - PostgreSQL (with PostgreSQL 13 service and health checks)

2. **Database setup in CI**:
   - Installs database clients (`mariadb-client`, `postgresql-client`)
   - Uses health checks to ensure databases are ready before testing
   - Sets up proper environment variables for each database type

3. **Additional checks**:
   - TypeScript type checking (`yarn test:types`)
   - Code linting (`yarn lint`)
   - Module building
   - Documentation building

## Common Issues and Solutions

### Database Connection Issues

**MySQL not running:**
```bash
# Start MySQL with Docker
docker run --name mysql-test -e MYSQL_ROOT_PASSWORD=123 -e MYSQL_DATABASE=test_db -p 3306:3306 -d mysql:5.7
```

**PostgreSQL not running:**
```bash
# Start PostgreSQL with Docker
docker run --name postgres-test -e POSTGRES_PASSWORD=123 -e POSTGRES_DB=test_db -p 5432:5432 -d postgres:13
```

**Wrong credentials:**
Check environment variables and ensure they match your database setup.

**Permission denied:**
Ensure database user has proper permissions to create/drop databases and tables.

### Test Failures

**Clean database state:**
Tests may fail if database has existing data. The test scripts handle cleanup automatically.

**Port conflicts:**
Ensure MySQL port 3306 and PostgreSQL port 5432 are available.

**File permissions:**
Ensure test database files are writable (mainly for SQLite tests).

**Connection limits:**
PostgreSQL tests automatically configure connection limits, but you may need to adjust for your setup.

## Best Practices

### Writing Tests

1. **Use descriptive test names** that explain what is being tested
2. **Test both success and failure cases**
3. **Clean up after each test** to ensure isolation
4. **Use the test setup utilities** for consistent database configuration
5. **Mock external dependencies** in unit tests
6. **Test the public API** rather than internal implementation details

### Test Organization

1. **Group related tests** in describe blocks
2. **Use beforeEach/afterEach** for setup and cleanup
3. **Keep tests focused** on a single behavior
4. **Use meaningful assertions** that clearly show what is expected

### Database Testing

1. **Use different database types** to ensure compatibility
2. **Test migrations** to ensure schema changes work correctly
3. **Test with realistic data** that matches production scenarios
4. **Verify cleanup** to prevent test pollution

## Next Steps

- [Development Setup](./development-setup.md) - Set up your development environment
- [Architecture](./architecture.md) - Understand the module's internal architecture
- [Contributing](./contributing.md) - Learn how to contribute to the project