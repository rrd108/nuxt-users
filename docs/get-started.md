# Nuxt Users

A user authentication module for Nuxt 3 and Nuxt 4 with database support for SQLite, MySQL, and PostgreSQL.

## Features

- 🔐 User authentication with bcrypt password hashing
- 🗄️ Database support (SQLite, MySQL, PostgreSQL)
- 🛠️ CLI commands for database management
- 🔑 Password Reset Functionality
- 📦 Zero-config setup with sensible defaults
- 🔧 TypeScript support

## Quick Start with SQLite

For MySQL setup, see the [MySQL configuration example](/guide/database-setup#mysql), for Postgresql see the [Postresql configuration example](/guide/database-setup#postgresql) in the Database Setup guide.

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
npx nuxt-users migrate

# Create your first user
npx nuxt-users create-user user@example.com "John Doe" password123
# Create an admin user
npx nuxt-users create-user admin@example.com "Admin User" adminpass123 admin
```

## What's Included

- **Nuxt 3 & 4 Support**: Fully compatible with both Nuxt 3 and Nuxt 4
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