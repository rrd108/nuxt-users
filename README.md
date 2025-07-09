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

### 3. Create Your First User

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
| `yarn db:create-user <email> <name> <password>` | Create a new user |

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
```

## License

MIT
