# Nuxt Users

A user authentication module for Nuxt 3 and Nuxt 4 with database support for SQLite, MySQL, and PostgreSQL.

## Features

- 🔐 User authentication with bcrypt password hashing
- 🗄️ Database support (SQLite, MySQL, PostgreSQL)
- 🛠️ CLI commands for database management
- 🔑 Password Reset Functionality
- 📦 Zero-config setup with sensible defaults
- 🔧 TypeScript support
- 🚀 Nuxt 3 & 4 compatibility

## Quick Start

```bash
# Install the module
npm install nuxt-users

# Add to your nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    connector: {
      name: 'sqlite',
      options: {
        path: './data/default.sqlite3'
      }
    }
  }
})

# Run migrations
npx nuxt-users migrate

# Create your first user
npx nuxt-users create-user user@example.com "John Doe" password123
```

## Documentation

📚 **Full documentation is available at: [docs/](/docs/)**

- [Installation Guide](/docs/guide/installation)
- [Configuration Options](/docs/guide/configuration)
- [API Reference](/docs/api/)
- [Component Documentation](/docs/components/)
- [Database Schema](/docs/database/schema)
- [Contributing Guidelines](/docs/contributing/)

## Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test

# Build documentation
cd docs && yarn dev
```

## License

MIT

## Dev misc

### Using yalc

```bash
# Publish the module's new version
yalc publish

# Install the module in the consumer app
yalc add nuxt-users
```