# Basic Setup Examples

This guide provides practical, copy-paste ready examples for common Nuxt Users module setups. Start with the zero-config approach and progress to more customized implementations.

## Zero-Config Setup

The fastest way to get authentication working in your Nuxt app.

### 1. Complete Minimal Setup

```bash
# Install the module and peer dependencies
npm install nuxt-users
npm install db0 better-sqlite3 bcrypt nodemailer

# Initialize database
npx nuxt-users migrate

# Create your first user
npx nuxt-users create-user -e admin@example.com -n "Admin User" -p password123 -r admin
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users']
  // That's it! No configuration needed
})
```

```vue
<!-- pages/login.vue -->
<script setup>
import { useAuthentication } from '#imports'

const { login } = useAuthentication()

const handleLoginSuccess = (user) => {
  login(user)
  navigateTo('/dashboard')
}
</script>

<template>
  <div class="login-page">
    <h1>Login</h1>
    <NUsersLoginForm @success="handleLoginSuccess" />
  </div>
</template>
```

```vue
<!-- pages/dashboard.vue -->
<script setup>
import { useAuthentication } from '#imports'

// User is automatically initialized on app startup
const { user } = useAuthentication()

// Redirect if not authenticated
if (!user.value) {
  navigateTo('/login')
}
</script>

<template>
  <div class="dashboard">
    <header>
      <h1>Dashboard</h1>
      <div class="user-info">
        <span>Welcome, {{ user?.name }}!</span>
        <NUsersLogoutLink>Logout</NUsersLogoutLink>
      </div>
    </header>
    
    <main>
      <p>You are successfully logged in!</p>
      <NUsersProfileInfo />
    </main>
  </div>
</template>
```

### 2. Simple Blog with Authentication

A basic blog where only authenticated users can create posts.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    auth: {
      whitelist: [
        '/', // Home page accessible to everyone
        '/posts', // Blog posts readable by everyone
        '/posts/*' // Individual posts readable by everyone
      ]
    }
  }
})
```

```vue
<!-- pages/index.vue -->
<script setup>
import { useAuthentication } from '#imports'

// User is automatically initialized on app startup
const { user } = useAuthentication()
</script>

<template>
  <div class="home">
    <header>
      <h1>My Blog</h1>
      <nav>
        <NuxtLink to="/posts">Posts</NuxtLink>
        <div v-if="user">
          <NuxtLink to="/admin">Admin</NuxtLink>
          <NUsersLogoutLink>Logout</NUsersLogoutLink>
        </div>
        <NuxtLink v-else to="/login">Login</NuxtLink>
      </nav>
    </header>
    
    <main>
      <h2>Welcome to My Blog</h2>
      <p>Read the latest posts or log in to manage content.</p>
    </main>
  </div>
</template>
```

```vue
<!-- pages/admin.vue -->
<script setup>
import { useAuthentication } from '#imports'

// User is automatically initialized on app startup
const { user } = useAuthentication()

// Redirect if not authenticated
if (!user.value) {
  navigateTo('/login')
}
</script>

<template>
  <div class="admin">
    <h1>Admin Panel</h1>
    <p>Welcome, {{ user?.name }}! You can manage your blog here.</p>
    
    <!-- Admin content here -->
    <div class="admin-actions">
      <button>Create New Post</button>
      <button>Manage Posts</button>
      <button>View Analytics</button>
    </div>
  </div>
</template>
```

### 3. E-commerce Store with User Accounts

Basic e-commerce setup where users can create accounts to track orders.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    auth: {
      whitelist: [
        '/',
        '/products',
        '/products/*',
        '/about',
        '/contact'
      ],
      tokenExpiration: 10080 // 7 days for shopping convenience
    },
    
    passwordValidation: {
      minLength: 6,
      requireUppercase: false,
      requireSpecialChars: false
      // Relaxed for better user experience
    }
  }
})
```

```vue
<!-- pages/account.vue -->
<script setup>
import { useAuthentication } from '#imports'

// User is automatically initialized on app startup
const { user } = useAuthentication()

if (!user.value) {
  navigateTo('/login?redirect=/account')
}
</script>

<template>
  <div class="account">
    <h1>My Account</h1>
    
    <div class="account-sections">
      <section class="profile">
        <h2>Profile Information</h2>
        <NUsersProfileInfo />
      </section>
      
      <section class="orders">
        <h2>Order History</h2>
        <p>Your recent orders will appear here.</p>
      </section>
      
      <section class="settings">
        <h2>Account Settings</h2>
        <NuxtLink to="/account/password">Change Password</NuxtLink>
        <NUsersLogoutLink>Logout</NUsersLogoutLink>
      </section>
    </div>
  </div>
</template>
```

## Basic Configuration Examples

### Custom Database Location

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    connector: {
      name: 'sqlite',
      options: {
        path: './database/users.db' // Custom location
      }
    }
  }
})
```

### Relaxed Password Policy

Perfect for user-friendly applications:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    passwordValidation: {
      minLength: 6,
      requireUppercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
      preventCommonPasswords: true // Still recommended
    }
  }
})
```

### Extended Session Duration

For applications where users shouldn't be logged out frequently:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    auth: {
      tokenExpiration: 10080 // 7 days instead of default 24 hours
    }
  }
})
```

## Common Integration Patterns

### With Middleware for Protected Routes

```ts
// middleware/auth.ts
import { useAuthentication } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  // User is automatically initialized on app startup
  const { user } = useAuthentication()
  
  if (!user.value) {
    return navigateTo(`/login?redirect=${to.path}`)
  }
})
```

```vue
<!-- pages/protected.vue -->
<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>

<template>
  <div>
    <h1>Protected Content</h1>
    <p>Only authenticated users can see this.</p>
  </div>
</template>
```

### With Redirect After Login

```vue
<!-- pages/login.vue -->
<script setup>
import { useAuthentication } from '#imports'

const route = useRoute()
const { login } = useAuthentication()

const handleLoginSuccess = (user) => {
  login(user)
  
  // Redirect to intended page or default
  const redirectTo = route.query.redirect || '/dashboard'
  navigateTo(redirectTo)
}
</script>

<template>
  <div>
    <h1>Login</h1>
    <NUsersLoginForm @success="handleLoginSuccess" />
  </div>
</template>
```

### With Loading States

```vue
<!-- components/AuthWrapper.vue -->
<script setup>
import { useAuthentication } from '#imports'

// User is automatically initialized on app startup
// Manual initialization is optional and usually not needed
const { user, isLoading } = useAuthentication()
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <p>Loading...</p>
    </div>
    
    <!-- Authenticated state -->
    <div v-else-if="user" class="authenticated">
      <slot :user="user" />
    </div>
    
    <!-- Unauthenticated state -->
    <div v-else class="unauthenticated">
      <p>Please log in to continue.</p>
      <NuxtLink to="/login">Login</NuxtLink>
    </div>
  </div>
</template>
```

## Testing Your Setup

### 1. Verify Database Creation

```bash
# Check if database file was created
ls -la ./data/users.sqlite3

# Or check custom location
ls -la ./database/users.db
```

### 2. Test User Creation

```bash
# Create a test user
npx nuxt-users create-user -e test@example.com -n "Test User" -p password123

# Verify user was created (optional)
sqlite3 ./data/users.sqlite3 "SELECT * FROM users;"
```

### 3. Test Authentication Flow

1. Start your development server: `npm run dev`
2. Navigate to your login page
3. Log in with the test user credentials
4. Verify you can access protected routes
5. Test logout functionality

### 4. Common Issues and Solutions

**Database not found:**
```bash
# Make sure you ran the migration
npx nuxt-users migrate
```

**Login not working:**
- Check that you created a user with the correct credentials
- Verify your login form is emitting the success event correctly
- Check browser console for any JavaScript errors

**Redirects not working:**
- Ensure you're using `navigateTo()` instead of `router.push()`
- Check that your middleware is properly configured

## Next Steps

Once you have basic authentication working:

- **[Custom Components](/examples/custom-components)** - Style the authentication forms
- **[Advanced Configuration](/examples/advanced-configuration)** - Add email, roles, and more
- **[Password Reset](/user-guide/password-reset)** - Enable password recovery
- **[Authorization](/user-guide/authorization)** - Add role-based access control

## Quick Reference

### Essential Commands

```bash
# Install module
npm install nuxt-users

# Set up database
npx nuxt-users migrate

# Create user
npx nuxt-users create-user -e email@example.com -n "Name" -p password

# Start development
npm run dev
```

### Essential Components

```vue
<!-- Login form -->
<NUsersLoginForm @success="handleLogin" />

<!-- Logout link -->
<NUsersLogoutLink>Logout</NUsersLogoutLink>

<!-- User profile info -->
<NUsersProfileInfo />
```

### Essential Composable

```vue
<script setup>
import { useAuthentication } from '#imports'

// User is automatically initialized on app startup
const { user, login, logout } = useAuthentication()
</script>
```