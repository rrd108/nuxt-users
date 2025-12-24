# Nuxt Users

A user authentication module for Nuxt 3 and Nuxt 4 with database support for SQLite, MySQL, and PostgreSQL.

## Features

- 🔐 **Authentication & Security**
  - User registration, login, and logout
  - Secure password hashing with bcrypt
  - Password reset functionality
  - Session management

- 🗄️ **Database Support**
  - SQLite, MySQL, and PostgreSQL
  - Automatic migrations and schema management
  - CLI tools for database operations

- 🛡️ **Access Control**
  - Role-Based Access Control (RBAC)
  - Middleware for route protection
  - Permission-based authorization

- 🎨 **UI Components**
  - Pre-built authentication forms
  - User management interfaces
  - Responsive and customizable components

- ⚡ **Developer Experience**
  - Zero-config setup with sensible defaults
  - TypeScript support throughout
  - Nuxt 3 & 4 compatibility
  - Easy customization and extension

## Documentation

📚 **Full documentation is available at: [https://nuxt-users.webmania.cc/](https://nuxt-users.webmania.cc/)**

## License

MIT

## Dev Misc

### Using yalc

```bash
# Publish the module's new version
yalc publish

# Install the module in the consumer app
yalc add nuxt-users

# Clean up consumer app
yalc remove nuxt-users
yarn add nuxt-users
```