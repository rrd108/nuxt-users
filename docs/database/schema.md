# Database Schema

The module creates and manages several database tables for user authentication and password reset functionality.

## Tables Overview

| Table | Purpose |
|-------|---------|
| `users` | Store user accounts and credentials |
| `personal_access_tokens` | Store authentication tokens |
| `password_reset_tokens` | Store password reset tokens |
| `migrations` | Track applied database migrations |

## SQLite Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE personal_access_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tokenable_type TEXT NOT NULL,
  tokenable_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  abilities TEXT,
  last_used_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## MySQL Schema

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE personal_access_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  abilities TEXT,
  last_used_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## PostgreSQL Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE personal_access_tokens (
  id SERIAL PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  abilities TEXT,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

The following indexes are automatically created for better performance:

```sql
-- Password reset tokens indexes
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens (email);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens (token);
```

## Table Details

### Users Table

Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER/INT | Primary key, auto-increment |
| `email` | TEXT/VARCHAR(255) | User's email address (unique) |
| `name` | TEXT/VARCHAR(255) | User's display name |
| `password` | TEXT/VARCHAR(255) | Hashed password (bcrypt) |
| `role` | TEXT/VARCHAR(32) | User role for RBAC (defaults to 'user') |
| `active` | BOOLEAN | Whether the user is active (defaults to TRUE) |
| `created_at` | DATETIME | Account creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

### Personal Access Tokens Table

Stores authentication tokens for API access.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER/INT | Primary key, auto-increment |
| `tokenable_type` | TEXT/VARCHAR(255) | Type of token owner (e.g., 'user') |
| `tokenable_id` | INTEGER/INT | ID of the token owner |
| `name` | TEXT/VARCHAR(255) | Token name/description |
| `token` | TEXT/VARCHAR(255) | The actual token (unique) |
| `abilities` | TEXT | Token permissions (optional) |
| `last_used_at` | DATETIME | Last usage timestamp |
| `expires_at` | DATETIME | Token expiration timestamp |
| `created_at` | DATETIME | Token creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

### Password Reset Tokens Table

Stores tokens for password reset functionality.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER/INT | Primary key, auto-increment |
| `email` | TEXT/VARCHAR(255) | User's email address |
| `token` | TEXT/VARCHAR(255) | Reset token (unique, hashed) |
| `created_at` | DATETIME | Token creation timestamp |

### Migrations Table

Tracks which database migrations have been applied.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER/INT | Primary key, auto-increment |
| `name` | TEXT/VARCHAR(255) | Migration name (unique) |
| `executed_at` | DATETIME | Migration execution timestamp |

## Data Relationships

- **Users → Personal Access Tokens**: One-to-many relationship
- **Users → Password Reset Tokens**: One-to-many relationship (by email)
- **Migrations**: Independent tracking table

## Database-Specific Considerations

### PostgreSQL

- Uses `SERIAL` for auto-incrementing primary keys
- Uses `TIMESTAMP` instead of `DATETIME` for timestamps
- Uses `INTEGER` instead of `INT` for foreign keys
- Supports JSON data types for advanced use cases
- Better performance for complex queries and large datasets

### MySQL

- Uses `AUTO_INCREMENT` for auto-incrementing primary keys
- Uses `DATETIME` for timestamps
- Uses `INT` for integer fields
- Good performance for read-heavy workloads

### SQLite

- Uses `INTEGER PRIMARY KEY AUTOINCREMENT` for auto-incrementing primary keys
- Uses `DATETIME` for timestamps
- Lightweight and file-based
- Perfect for development and small applications

## Security Considerations

- Passwords are hashed using bcrypt
- Tokens are cryptographically secure random strings
- Password reset tokens are hashed before storage
- Tokens have expiration times
- Email addresses are validated and unique

## Next Steps

- [Database Setup](/guide/database-setup) - Learn how to set up your database
- [Migrations](/database/migrations) - Understand the migration system
- [CLI Commands](/database/cli-commands) - Database management commands 