# Getting Started

Welcome to Nuxt Users! This guide will get you up and running with a complete authentication system in just a few minutes. We'll start with the absolute simplest setup and then show you how to customize it for your needs.

## Zero-Config Quick Start

The fastest way to get started is with our zero-config approach. Just install the module and you're ready to go!

### 1. Install the Module and Dependencies

```bash
# Install the module
npm install nuxt-users
# or
yarn add nuxt-users
# or
pnpm add nuxt-users

# Install required peer dependencies
npm install db0 better-sqlite3 bcrypt nodemailer
# or
yarn add db0 better-sqlite3 bcrypt nodemailer
# or
pnpm add db0 better-sqlite3 bcrypt nodemailer
```

### 2. Add to Your Nuxt Config

Add the module to your `nuxt.config.ts` - that's it! No configuration needed:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users']
})
```

The module automatically sets up:
- SQLite database at `./data/users.sqlite3`
- All necessary database tables
- Authentication API endpoints
- Vue components for login/logout
- Session management

> **Note**: The "zero-config" setup handles database and API setup, but **protected routes require permissions configuration**. Without permissions, authenticated users will be redirected to login. You'll add this configuration in step 4 below.

### 3. Initialize Your Database

Run the migration command to set up your database:

```bash
npx nuxt-users migrate
```

### 4. Create Your First User

```bash
npx nuxt-users create-user admin@example.com "Admin User" password123 admin
```

> ⚠️ **IMPORTANT: Permissions Required for Protected Routes**
> 
> After creating users, they won't be able to access any protected pages (including admins) until you configure permissions. This module uses a **whitelist approach** for security - no one has access by default.
> 
> Add this to your `nuxt.config.ts` to allow your admin user to access all routes:
> ```ts
> export default defineNuxtConfig({
>   modules: ['nuxt-users'],
>   nuxtUsers: {
>     auth: {
>       permissions: {
>         admin: ['*'], // Admin can access everything
>         user: ['/profile', '/api/nuxt-users/me'] // Basic user access
>       }
>     }
>   }
> })
> ```
> 
> **Without this configuration, authenticated users will be redirected to login when trying to access any page.** See the [Authorization Guide](/user-guide/authorization) for more details.

### 5. Add Login to Your App

Create a simple login page or add the login form to any existing page:

```vue
<script setup>
import { useAuthentication } from '#imports'

const { login } = useAuthentication()

const handleLoginSuccess = (user) => {
  console.log('User logged in:', user)
  login(user)
  // Redirect to dashboard or home page
  navigateTo('/')
}
</script>

<template>
  <div>
    <h1>Login</h1>
    <NUsersLoginForm @success="handleLoginSuccess" />
  </div>
</template>
```

### 6. Show User Info

Display logged-in user information anywhere in your app:

```vue
<script setup>
import { useAuthentication } from '#imports'

const { user, initializeUser } = useAuthentication()

// Initialize user from localStorage on page load
initializeUser()
</script>

<template>
  <div>
    <div v-if="user">
      <h2>Welcome, {{ user.name }}!</h2>
      <p>Email: {{ user.email }}</p>
      <NUsersLogoutLink>Logout</NUsersLogoutLink>
    </div>
    <div v-else>
      <p>Please log in</p>
      <NuxtLink to="/login">Login</NuxtLink>
    </div>
  </div>
</template>
```

That's it! You now have a fully functional authentication system. 🎉

## Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your login page
3. Log in with the user you created: `admin@example.com` / `password123`
4. You should see the user information displayed

## Essential Configuration

After the initial setup, you'll need to configure permissions for your users to access protected routes. Here are the essential configurations:

### User Permissions (Required)

This is **essential** - without permissions, authenticated users cannot access protected routes:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    auth: {
      permissions: {
        admin: ['*'], // Admin can access everything
        user: ['/profile', '/dashboard']
      }
    }
  }
})
```

### Database Location

Change where your SQLite database is stored:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    connector: {
      name: 'sqlite',
      options: {
        path: './my-app-users.sqlite3'
      }
    }
  }
})
```

### Password Requirements

Adjust password validation rules:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    passwordValidation: {
      minLength: 6,
      requireUppercase: false,
      requireNumbers: false,
      requireSpecialChars: false
    }
  }
})
```

### Session Duration

Control how long users stay logged in:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    auth: {
      tokenExpiration: 60 // 1 hour (in minutes)
    }
  }
})
```

## Available Components

The module provides ready-to-use Vue components:

- `<NUsersLoginForm>` - Complete login form with validation
- `<NUsersLogoutLink>` - Logout button/link
- `<NUsersProfileInfo>` - Display user profile information
- `<NUsersResetPasswordForm>` - Password reset form
- `<NUsersList>` - List all users (admin feature)
- `<NUsersUserForm>` - Create/edit user form

## What's Included Out of the Box

✅ **User Authentication**
- Secure login/logout with bcrypt password hashing
- Session management with configurable expiration
- Automatic token refresh

✅ **Database Support**
- SQLite (zero-config default)
- MySQL and PostgreSQL support available
- Automatic database migrations

✅ **Vue Components**
- Pre-built, styled authentication forms
- Responsive design that works on all devices
- Customizable with CSS variables

✅ **API Endpoints**
- RESTful API for user management
- Session management endpoints
- Password reset functionality

✅ **TypeScript Support**
- Full type safety throughout
- IntelliSense for all composables and components

## Next Steps

Now that you have authentication working, you might want to:

- **[Add Password Reset](/user-guide/password-reset)** - Let users reset forgotten passwords
- **[Configure Authorization](/user-guide/authorization)** - Set up role-based access control
- **[Customize Components](/user-guide/components)** - Style the forms to match your app
- **[Advanced Configuration](/user-guide/configuration)** - Explore all available options
- **[Use Different Databases](/user-guide/installation#database-options)** - Switch to MySQL or PostgreSQL

## Need Help?

- Check the [Troubleshooting Guide](/user-guide/troubleshooting) for common issues
- Browse [Practical Examples](/examples/basic-setup) for more use cases
- Review the [API Reference](/api/) for detailed endpoint documentation

## Common First Steps

Most users want to do these things after the basic setup:

1. **Style the login form** to match your app's design
2. **Add password reset** functionality for better user experience  
3. **Set up role-based permissions** if you need admin users
4. **Configure email sending** for password resets and notifications

Each of these is covered in detail in the respective guide sections.