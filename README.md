# Nuxt Users

A user authentication module for Nuxt 3 with database support for SQLite, MySQL, and PostgreSQL.

## Features

- 🔐 User authentication with bcrypt password hashing
- 🗄️ Database support (SQLite, MySQL, PostgreSQL)
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

### 1. Create Users Table

```bash
yarn db:create-users-table
```

### 2. Create Personal Access Tokens Table

This table is required for storing authentication tokens.

```bash
yarn db:create-personal-access-tokens-table
```

### 3. Create Password Reset Tokens Table (for Password Resets)

This table is required for storing tokens used in the password reset flow.

```bash
yarn db:create-password-reset-tokens-table
```

### 4. Create Your First User

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
| `yarn db:create-personal-access-tokens-table` | Create the personal access tokens table |
| `yarn db:create-password-reset-tokens-table` | Create the password reset tokens table |
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
-- Optional: Indexes for faster lookups
-- CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens (email);
-- CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens (token);
```

## License

MIT
