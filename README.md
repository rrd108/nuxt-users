# Nuxt Users

A user authentication module for Nuxt 3 with database support for SQLite and MySQL.

## Features

- 🔐 User authentication with bcrypt password hashing
- 🗄️ Database support (SQLite, MySQL)
- 🛠️ CLI commands for database management
- 🔑 Password Reset Functionality
- 📦 Zero-config setup with sensible defaults
- 🔧 TypeScript support

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

## TODO

- [ ] Use `--stub` flag for module-builder to avoid building the module in the playground

```
"dev:prepare": "yarn nuxt-module-build build --stub && yarn nuxt-module-build prepare && nuxi prepare playground",
```

