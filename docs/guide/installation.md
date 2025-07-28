# Installation

## Nuxt Version Support

This module is compatible with both **Nuxt 3** and **Nuxt 4**. The installation and configuration process is the same for both versions.

## Install the Module

```bash
npm install nuxt-users
# or
yarn add nuxt-users
```

## Required Dependencies

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

## Add to Nuxt Config

Add the module to your `nuxt.config.ts` (works for both Nuxt 3 and Nuxt 4):

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    connector: {
      name: 'sqlite', // | 'mysql' | 'postgresql'
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

- [Quick Start Tutorial](/guide/quick-start) - Get up and running quickly
- [Configuration Options](/guide/configuration) - Learn about all available options
- [Database Setup](/guide/database-setup) - Detailed database configuration 