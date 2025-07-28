# Quick Start

Get up and running with Nuxt Users in minutes. This guide works for both Nuxt 3 and Nuxt 4.

## 1. Install the Module

```bash
npm install nuxt-users
```

## 2. Add to Your Nuxt Config

```ts
// nuxt.config.ts
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
```

## 3. Set Up Your Database

```bash
# Run all migrations
npx nuxt-users migrate

# Create your first user
npx nuxt-users create-user user@example.com "John Doe" password123
# Create an admin user
npx nuxt-users create-user admin@example.com "Admin User" adminpass123 admin
```

## 4. Add Login Form to Your App

```vue
<template>
  <div>
    <h1>Welcome to My App</h1>
    <LoginForm @success="handleLoginSuccess" />
  </div>
</template>

<script setup>
const handleLoginSuccess = (user) => {
  console.log('User logged in:', user)
  // Redirect or update UI
}
</script>
```

## 5. Test Your Setup

1. Start your development server: `yarn dev`
2. Navigate to your app
3. Try logging in with the user you created
4. Check the browser's Network tab to see the API calls

## What's Next?

- [Configuration Options](/guide/configuration) - Learn about all available options
- [Authentication Flow](/guide/authentication) - Understand how authentication works
- [Password Reset](/guide/password-reset) - Add password reset functionality
- [API Reference](/api/) - Explore the available API endpoints 