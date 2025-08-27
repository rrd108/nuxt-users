# Development Setup

Get your development environment ready for contributing to Nuxt Users.

## Prerequisites

- Node.js v22 (required)
- Yarn package manager
- Git

## 1. Clone the Repository

```bash
git clone <repository-url>
cd nuxt-users
```

## 2. Install Dependencies

```bash
yarn install
```

### Peer Dependencies for Development

When developing the module, you'll need all peer dependencies installed to test different database connectors:

```bash
# Install all peer dependencies for comprehensive testing
yarn add db0 better-sqlite3 mysql2 pg bcrypt nodemailer @formkit/nuxt
```

## 3. Build the Module

```bash
yarn dev:prepare
```

This command:
- Builds the module with stubs
- Prepares the playground application
- Sets up the development environment

## 4. Start Development Server

```bash
# Start the playground application
yarn dev

# Or start the documentation
yarn docs:dev
```

## 5. Verify Setup

1. **Check the playground**: Visit `http://localhost:3000` to see the test application
2. **Check documentation**: Visit `http://localhost:5173` to see the VitePress docs
3. **Run tests**: `yarn test` to ensure everything works

## Development Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start playground development server |
| `yarn dev:build` | Build the playground application |
| `yarn dev:prepare` | Prepare development environment |
| `yarn docs:dev` | Start documentation server |
| `yarn docs:build` | Build documentation |
| `yarn docs:preview` | Preview built documentation |

## Project Structure

```
nuxt-users/
├── src/                    # Module source code
│   ├── module.ts          # Main module file
│   ├── types.ts           # TypeScript types
│   └── runtime/           # Runtime code
│       ├── components/    # Vue components
│       ├── plugin.ts      # Nuxt plugin
│       └── server/        # Server-side code
│           ├── api/       # API endpoints
│           ├── services/  # Business logic
│           └── utils/     # Database utilities
├── test/                  # Test files
├── playground/            # Test application
├── docs/                  # Documentation
├── scripts/               # Test scripts
│   ├── test-sqlite.sh     # SQLite test runner
│   ├── test-mysql.sh      # MySQL test runner
│   └── test-postgresql.sh # PostgreSQL test runner
└── .github/workflows/     # CI/CD configuration
    └── ci.yml            # Continuous integration
```

## Database Setup for Development

### SQLite (Default)

No additional setup required. The module will create SQLite files automatically.

### MySQL

For MySQL testing, you need a running MySQL instance:

```bash
# Using Docker
docker run --name mysql-test \
  -e MYSQL_ROOT_PASSWORD=123 \
  -e MYSQL_DATABASE=test_db \
  -p 3306:3306 \
  -d mysql:5.7

# Set environment variables
export DB_CONNECTOR=mysql
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=123
export DB_NAME=test_db
```

### PostgreSQL

For PostgreSQL testing, you need a running PostgreSQL instance:

```bash
# Using Docker
docker run --name postgres-test \
  -e POSTGRES_PASSWORD=123 \
  -e POSTGRES_DB=test_db \
  -p 5432:5432 \
  -d postgres:13

# Set environment variables
export DB_CONNECTOR=postgresql
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=123
export DB_NAME=test_db
```

## Next Steps

- [Testing](/developer-guide/testing) - Learn how to run and write tests
- [Contributing](/developer-guide/contributing) - Understand contribution guidelines
- [Code Style](/developer-guide/code-style) - Follow the project's coding standards