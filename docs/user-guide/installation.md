# Installation

## Nuxt Version Support

This module is compatible with both **Nuxt 3** and **Nuxt 4**. The installation and configuration process is the same for both versions.

## Install the Module

```bash
npm install nuxt-users
# or
yarn add nuxt-users
```

## Peer Dependencies

This module uses peer dependencies to avoid bundling unnecessary packages and to give you control over which database and email providers you want to use. You must manually install these dependencies in your project:

### Required Peer Dependencies

```bash
# Database support (choose one or more based on your needs)
npm install db0 better-sqlite3 mysql2 pg

# Password hashing
npm install bcrypt

# Email functionality (required for password reset features)
npm install nodemailer
```

### Optional Peer Dependencies

```bash
# Form components (recommended for better UX)
npm install @formkit/nuxt
```

### Why Peer Dependencies?

- **Database flexibility**: You only install the database drivers you need
- **Bundle size optimization**: Avoids bundling unused database connectors
- **Version control**: You control the exact versions of database drivers
- **Security**: You can audit and update dependencies independently

### What Happens If Dependencies Are Missing?

If you try to use features that require missing peer dependencies, the module will throw descriptive errors with installation instructions. For example:
- Using MySQL without `mysql2` installed
- Using password reset without `nodemailer` installed
- Using password hashing without `bcrypt` installed

## Add to Nuxt Config

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    connector: {
      name: 'sqlite', // | 'mysql' | 'postgresql'
      options: {
        path: './data/users.sqlite3'
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
    // Optional: Configure URL path for password reset page
    // passwordResetUrl: '/reset-password', // Default
  }
})
```

## Database Setup

After installation, you need to set up your database:

```bash
# Run all migrations (recommended)
npx nuxt-users migrate

# Or run individual commands
npx nuxt-users create-users-table
npx nuxt-users create-personal-access-tokens-table
npx nuxt-users create-password-reset-tokens-table

# Create your first user
npx nuxt-users create-user user@example.com "John Doe" password123
```

## Next Steps

- [Getting Started](/user-guide/getting-started) - Get up and running quickly
- [Configuration](/user-guide/configuration) - Learn about all available options
- [Authentication](/user-guide/authentication) - Set up user authentication
- [Components](/user-guide/components) - Use the provided Vue components