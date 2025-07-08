# Nuxt Users

A user authentication module for Nuxt 3 with database support for SQLite, MySQL, and PostgreSQL.

## Features

- 🔐 User authentication with bcrypt password hashing
- 🗄️ Database support (SQLite, MySQL, PostgreSQL)
- 🛠️ CLI commands for database management
- 📦 Zero-config setup with sensible defaults
- 🔧 TypeScript support

## Installation

```bash
npm install nuxt-users
# or
yarn add nuxt-users
```

## Setup

Add to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    connector: {
      name: 'sqlite', // | 'mysql' | 'postgresql'
      options: {
        path: './data/db.sqlite3'
      }
    }
  }
})
```

## Database Setup

### 1. Create Users Table

```bash
yarn db:create-users-table
```

### 2. Create Your First User

```bash
yarn db:create-user rrd@example.com "John Doe" mypassword123
```

## Database Connectors

### SQLite (Default)
```ts
nuxtUsers: {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/db.sqlite3'
    }
  }
}
```

### MySQL
```ts
nuxtUsers: {
  connector: {
    name: 'mysql',
    options: {
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'myapp'
    }
  }
}
```

### PostgreSQL
```ts
nuxtUsers: {
  connector: {
    name: 'postgresql',
    options: {
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'myapp'
    }
  }
}
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `yarn db:create-users-table` | Create the users table |
| `yarn db:create-user <email> <name> <password>` | Create a new user |

## Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## License

MIT
