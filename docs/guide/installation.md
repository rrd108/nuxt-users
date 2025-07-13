# Installation

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

Add the module to your `nuxt.config.ts`:

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
yarn db:migrate

# Or run individual commands
yarn db:create-users-table
yarn db:create-personal-access-tokens-table
yarn db:create-password-reset-tokens-table

# Create your first user
yarn db:create-user user@example.com "John Doe" password123
```

## Next Steps

- [Quick Start Tutorial](/guide/quick-start) - Get up and running quickly
- [Configuration Options](/guide/configuration) - Learn about all available options
- [Database Setup](/guide/database-setup) - Detailed database configuration 