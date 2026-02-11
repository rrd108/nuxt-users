# Nuxt Users
[![Context7](https://img.shields.io/badge/Context7-Indexed-blue)](https://context7.com/rrd108/nuxt-users)
[![npm version](https://img.shields.io/npm/v/nuxt-users/latest.svg)](https://www.npmjs.com/package/nuxt-users)
[![npm downloads](https://img.shields.io/npm/dm/nuxt-users.svg)](https://www.npmjs.com/package/nuxt-users)
[![License](https://img.shields.io/npm/l/nuxt-users.svg)](https://github.com/rrd108/nuxt-users/blob/main/LICENSE)
[![ci](https://github.com/rrd108/nuxt-users/actions/workflows/ci.yml/badge.svg)](https://github.com/rrd108/nuxt-users/actions/workflows/ci.yml)
[![Nuxt 3](https://img.shields.io/badge/Nuxt-3-00DC82.svg?logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82.svg?logo=nuxt.js&logoColor=white)](https://nuxt.com)


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

## Agent Skill

Install the **nuxt-users** [Agent Skill](https://agentskills.io/specification) so your AI coding agent (Cursor, Claude Code, etc.) has procedural knowledge for this module. One-time install:

```bash
npx skills add rrd108/nuxt-users
```

After that, your agent can use the skill when you work on auth, config, CLI, composables, or authorization. The skill is also [listed on the Skills directory](https://skills.sh/) once installs are tracked.

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