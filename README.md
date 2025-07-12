# Nuxt Users

A user authentication module for Nuxt 3 with database support for SQLite and MySQL.

## Features

- 🔐 User authentication with bcrypt password hashing
- 🗄️ Database support (SQLite, MySQL)
- 🛠️ CLI commands for database management
- 🔑 Password Reset Functionality
- 📦 Zero-config setup with sensible defaults
- 🔧 TypeScript support

## Installation

```bash
npm install nuxt-users
# or
yarn add nuxt-users
```

### Required Dependencies

This module requires the following dependencies to be installed in your project:

```bash
# For database support
npm install db0 better-sqlite3 mysql2

# For password hashing
npm install bcrypt

# For email functionality (password resets)
npm install nodemailer

# For form components (optional but recommended)
npm install @formkit/nuxt
```

## Setup

Add to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    connector: {
      name: 'sqlite', // | 'mysql'
      options: {
        path: './data/default.sqlite3'
      }
    }
    // Optional: Configure mailer for password resets
    // mailer: {
    //   host: 'smtp.example.com',
    //   port: 587,
    //   secure: false, // true for 465, false for other ports
    //   auth: {
    //     user: 'your-email-user',
    //     pass: 'your-email-password',
    //   },
    //   defaults: {
    //     from: '"Your App Name" <noreply@example.com>',
    //   },
    // },
    // Optional: Configure base URL for password reset links
    // passwordResetBaseUrl: 'http://localhost:3000', // Default
  }
})
```

### Mailer Configuration (for Password Resets)

To enable password reset emails, you need to configure the `mailer` option. This uses `nodemailer` under the hood.

Example using Ethereal Email for testing:
```ts
nuxtUsers: {
  // ... other options
  mailer: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'your-ethereal-user@ethereal.email', // Replace with your Ethereal username
      pass: 'your-ethereal-password',        // Replace with your Ethereal password
    },
    defaults: {
      from: '"My Nuxt App" <noreply@example.com>',
    },
  },
  passwordResetBaseUrl: 'http://localhost:3000', // URL used in the reset email link
}
```
Make sure to replace placeholder credentials with your actual mail server details for production.

## Authentication Flow

Upon successful login via the `/api/login` endpoint:

1.  A secure, random token is generated.
2.  This token is stored in the `personal_access_tokens` table, linked to the authenticated user.
3.  An HTTP-only cookie named `auth_token` is set in the browser, containing this token. This cookie is used for subsequent authenticated requests.

This system is inspired by __Laravel Sanctum__'s token-based authentication.

## Database Setup

### Option 1: Run All Migrations (Recommended)

The easiest way to set up your database is to run all migrations at once:

```bash
yarn db:migrate
```

This will create all necessary tables in the correct order.

### Option 2: Run Individual Table Creation Commands

You can also run table creation commands individually:

#### 1. Create Users Table

```bash
yarn db:create-users-table
```

#### 2. Create Personal Access Tokens Table

This table is required for storing authentication tokens.

```bash
yarn db:create-personal-access-tokens-table
```

#### 3. Create Password Reset Tokens Table (for Password Resets)

This table is required for storing tokens used in the password reset flow.

```bash
yarn db:create-password-reset-tokens-table
```

#### 4. Create Your First User

```bash
yarn db:create-user rrd@example.com "John Doe" mypassword123
```

### Migration System

The module includes a migration system that tracks which database changes have been applied. This ensures that:

- Migrations are only run once
- Database schema is consistent across environments
- Future database changes can be safely applied

The migration system creates a `migrations` table that tracks all applied migrations. When you run `yarn db:migrate`, it will:

1. Create the migrations table if it doesn't exist
2. Check which migrations have already been applied
3. Run only the pending migrations
4. Mark each migration as applied after successful execution

This system allows for safe database schema evolution as the module is updated.

## Database Connectors

### SQLite (Default)
```ts
nuxtUsers: {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/default.sqlite3'
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

## CLI Commands

| Command | Description |
|---------|-------------|
| `yarn db:migrate` | Run all pending migrations (recommended) |
| `yarn db:create-users-table` | Create the users table |
| `yarn db:create-personal-access-tokens-table` | Create the personal access tokens table |
| `yarn db:create-password-reset-tokens-table` | Create the password reset tokens table |
| `yarn db:create-migrations-table` | Create the migrations tracking table |
| `yarn db:create-user <email> <name> <password>` | Create a new user |

## Password Reset

This module includes a complete password reset flow.

### Flow Overview

1.  User visits a "Forgot Password" page and enters their email.
2.  An email is sent to the user with a unique, time-limited password reset link.
3.  User clicks the link and is taken to a "Reset Password" page.
4.  User enters and confirms their new password.
5.  Password is updated, and the reset token is invalidated.

### Configuration

Ensure you have configured the `mailer` and `passwordResetBaseUrl` options in your `nuxt.config.ts` as described in the [Setup](#setup) section. You also need to create the `password_reset_tokens` table (see [Database Setup](#database-setup)).

### Components

#### `ForgotPasswordForm`

This component provides a form for users to request a password reset link.

**Basic Usage:**
```vue
<template>
  <ForgotPasswordForm />
</template>
```
This component handles its own API calls and message display. It has no specific props or events to configure for basic use.

#### `ResetPasswordForm`

This component provides a form for users to set a new password using a token from the reset link. It automatically reads the `token` and `email` from the URL query parameters.

**Basic Usage:**
```vue
<template>
  <ResetPasswordForm />
</template>
```
This component handles its own API calls, message display, and redirection to login upon success. It has no specific props or events for basic use.

### API Endpoints

The password reset functionality uses the following server API endpoints:

-   `POST /api/forgot-password`: Expects `{ email: string }`. Initiates the password reset process.
-   `POST /api/reset-password`: Expects `{ token: string, email: string, password: string, password_confirmation: string }`. Completes the password reset process.

These are typically called by the provided Vue components, but you can interact with them directly if needed.

## Login Component

This module provides a flexible `LoginForm` component that you can use in your frontend. The component uses Formkit for form handling and validation, and includes slots for complete customization.

### Basic Usage

First, install Formkit in your project:

```bash
npm install @formkit/nuxt
# or
yarn add @formkit/nuxt
```

Add Formkit to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users', '@formkit/nuxt'],
  // ... other config
})
```

Then use the component in your Vue template:

```vue
<template>
  <LoginForm 
    @success="handleSuccess"
    @error="handleError"
    @submit="handleSubmit"
  />
</template>

<script setup>
const handleSuccess = (user) => {
  console.log('Login successful:', user)
  // Handle successful login
}

const handleError = (error) => {
  console.log('Login error:', error)
  // Handle login error
}

const handleSubmit = (data) => {
  console.log('Form submitted:', data)
  // Handle form submission
}
</script>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | `'/api/login'` | The API endpoint for login requests |
| `redirectTo` | `string` | `'/'` | Where to redirect after successful login |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `success` | `User` | Emitted when login is successful |
| `error` | `string` | Emitted when login fails |
| `submit` | `LoginFormData` | Emitted when form is submitted |

### Slots

The component provides several slots for customization:

#### `header`
Customize the form header (title and subtitle).

```vue
<LoginForm>
  <template #header>
    <div class="custom-header">
      <h2>Welcome to My App</h2>
      <p>Please sign in to continue</p>
    </div>
  </template>
</LoginForm>
```

#### `email-field`
Customize the email input field.

```vue
<LoginForm>
  <template #email-field>
    <FormKit
      type="email"
      name="email"
      label="Email Address"
      placeholder="your.email@example.com"
      validation="required|email"
    />
  </template>
</LoginForm>
```

#### `password-field`
Customize the password input field.

```vue
<LoginForm>
  <template #password-field>
    <FormKit
      type="password"
      name="password"
      label="Password"
      placeholder="Enter your password"
      validation="required|length:6"
    />
  </template>
</LoginForm>
```

#### `remember-me`
Customize the remember me checkbox.

```vue
<LoginForm>
  <template #remember-me>
    <div class="remember-me">
      <FormKit
        type="checkbox"
        name="rememberMe"
        label="Keep me signed in"
      />
    </div>
  </template>
</LoginForm>
```

#### `submit-button`
Customize the submit button.

```vue
<LoginForm>
  <template #submit-button>
    <FormKit
      type="submit"
      class="custom-button"
    >
      Sign In to My App
    </FormKit>
  </template>
</LoginForm>
```

#### `footer`
Customize the form footer (e.g., forgot password link).

```vue
<LoginForm>
  <template #footer>
    <div class="login-footer">
      <p>Don't have an account? <a href="/signup">Sign up</a></p>
    </div>
  </template>
</LoginForm>
```

#### `error-message`
Customize how error messages are displayed.

```vue
<LoginForm>
  <template #error-message="{ error }">
    <div v-if="error" class="custom-error">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
    </div>
  </template>
</LoginForm>
```

### Styling

The component comes with a clean, modern design that works without any CSS framework. You can customize the appearance by:

1. **Using CSS custom properties**: The component uses CSS custom properties for colors, spacing, and other design tokens.

2. **Overriding styles**: Use `:deep()` to target Formkit elements and customize their appearance.

3. **Using slots**: Replace any part of the form with your own custom components.

### Example with Custom Styling

```vue
<template>
  <LoginForm 
    class="my-login-form"
    @success="handleSuccess"
  >
    <template #header>
      <div class="branded-header">
        <h2>Welcome to MyApp</h2>
        <p>Sign in to access your dashboard</p>
      </div>
    </template>
    
    <template #submit-button>
      <FormKit
        type="submit"
        class="branded-button"
      >
        Sign In
      </FormKit>
    </template>
  </LoginForm>
</template>

<style scoped>
.my-login-form {
  --fk-border-color: #059669;
  --fk-border-color-focus: #047857;
  --fk-bg-color: #f0fdf4;
}

.branded-header h2 {
  color: #059669;
  font-size: 2rem;
  font-weight: 700;
}

.branded-button {
  background-color: #059669 !important;
  border-color: #059669 !important;
  font-weight: 600 !important;
}

.branded-button:hover:not(:disabled) {
  background-color: #047857 !important;
  border-color: #047857 !important;
}
</style>
```

## Database Schema

### SQLite Schema
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
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

### MySQL Schema
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
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

### Indexes
The following indexes are automatically created for better performance:
```sql
-- Password reset tokens indexes
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens (email);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens (token);
```

## Contributing

We welcome contributions! Whether you're reporting bugs, suggesting features, or submitting code changes, your help is appreciated.

### Reporting Issues

- **Bug Reports**: Please include steps to reproduce, expected vs actual behavior, and your environment details
- **Feature Requests**: Describe the use case and how it would benefit users
- **Documentation Issues**: Let us know if anything is unclear or missing

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nuxt-users
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Build the module**
   ```bash
   yarn dev:prepare
   ```

### Running Tests

The project includes comprehensive tests for both SQLite and MySQL databases.

#### Run All Tests
```bash
# Run all tests (SQLite + MySQL)
yarn test

# Run tests in watch mode
yarn test:watch
```

#### Database-Specific Tests
```bash
# Run tests against SQLite only
yarn test:sqlite

# Run tests against MySQL only
yarn test:mysql
```

#### Individual Test Files
```bash
# Run specific test files
yarn test:sqlite test/basic.test.ts
yarn test:mysql test/login.test.ts

# Run tests matching a pattern
yarn test:sqlite "create-users-table"
yarn test:mysql "create-users-table"
```

#### Test Files Overview

| File | Description |
|------|-------------|
| `test/basic.test.ts` | Basic module functionality and setup |
| `test/login.test.ts` | Login API endpoint and authentication flow |
| `test/cli.*.test.ts` | CLI command tests (table creation, user creation) |
| `test/utils.db.test.ts` | Database utility function tests |
| `test/utils.user.test.ts` | User management utility tests |

#### MySQL Testing Requirements

For MySQL tests, you need a running MySQL instance. The tests use these default credentials:
- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: `123`
- Database: `test_db`

You can override these with environment variables:
```bash
export DB_HOST=your-mysql-host
export DB_PORT=3306
export DB_USER=your-user
export DB_PASSWORD=your-password
export DB_NAME=your-test-db
```

#### Quick MySQL Setup with Docker
```bash
# Start MySQL container for testing
docker run --name mysql-test \
  -e MYSQL_ROOT_PASSWORD=123 \
  -e MYSQL_DATABASE=test_db \
  -p 3306:3306 \
  -d mysql:5.7

# Run MySQL tests
yarn test:mysql
```

### Code Quality

#### Linting
```bash
# Check code style
yarn lint

# Auto-fix linting issues
yarn lint --fix
```

#### Type Checking
```bash
# Check TypeScript types
yarn test:types
```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Run all tests
   yarn test
   
   # Check types
   yarn test:types
   
   # Lint code
   yarn lint
   ```

4. **Submit a pull request**
   - Include a clear description of your changes
   - Reference any related issues
   - Ensure all tests pass

### Development Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start development server with playground |
| `yarn dev:build` | Build the playground application |
| `yarn dev:prepare` | Prepare development environment |
| `yarn test` | Run all tests |
| `yarn test:watch` | Run tests in watch mode |
| `yarn test:sqlite` | Run SQLite tests only |
| `yarn test:mysql` | Run MySQL tests only |
| `yarn test:types` | Check TypeScript types |
| `yarn lint` | Run ESLint |
| `yarn release` | Build and release the package |

### Testing Database Migrations

You can test the CLI commands manually:

```bash
# Test table creation
yarn db:create-users-table
yarn db:create-personal-access-tokens-table
yarn db:create-password-reset-tokens-table
yarn db:create-migrations-table

# Test user creation
yarn db:create-user test@example.com "Test User" password123

# Test migrations
yarn db:migrate
```

### Playground Development

The `playground/` directory contains a test application for development:

```bash
# Start playground development server
yarn dev

# Build playground
yarn dev:build
```

### What We're Looking For

- **Bug fixes**: Any issues that break functionality
- **Performance improvements**: Faster database queries, better memory usage
- **New features**: Additional authentication methods, database support
- **Documentation**: Better examples, clearer explanations
- **Tests**: More test coverage, edge case testing
- **Code quality**: Better error handling, cleaner code

### Getting Help

- **Issues**: Use GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions and ideas
- **Code**: Submit pull requests for code changes

We appreciate all contributions, big and small! 🚀

## License

MIT
