# Nuxt Users

A user authentication module for Nuxt 3 with database support for SQLite, MySQL, and PostgreSQL.

## Features

- 🔐 User authentication with bcrypt password hashing
- 🗄️ Database support (SQLite, MySQL, PostgreSQL)
- 🛠️ CLI commands for database management
- 🔑 Password Reset Functionality
- 📦 Zero-config setup with sensible defaults
- 🔧 TypeScript support

## Quick Start

```bash
# Install the module
yarn add nuxt-users

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
yarn db:migrate

# Create your first user
yarn db:create-user user@example.com "John Doe" password123
```

## What's Included

- **Authentication System**: Secure login with token-based authentication
- **Database Support**: SQLite, MySQL, and PostgreSQL with automatic migrations
- **Password Reset**: Complete email-based password reset flow
- **Vue Components**: Ready-to-use login and password reset forms
- **CLI Tools**: Database management and user creation commands
- **TypeScript**: Full type safety and IntelliSense support

## Get Started

- [Installation Guide](/guide/installation)
- [Quick Start Tutorial](/guide/quick-start)
- [Configuration Options](/guide/configuration)
- [API Reference](/api/)
- [Component Documentation](/components/)

## License

MIT 