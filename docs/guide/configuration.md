# Configuration

## Basic Configuration

The module can be configured in your `nuxt.config.ts` (compatible with both Nuxt 3 and Nuxt 4):

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    connector: {
      name: 'sqlite', // | 'mysql' | 'postgresql'
      options: {
        path: './data/default.sqlite3'
      }
    },
    tables: {
      users: 'users',
      personalAccessTokens: 'personal_access_tokens',
      passwordResetTokens: 'password_reset_tokens'
    },
    mailer: {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'your-email-user',
        pass: 'your-email-password',
      },
      defaults: {
        from: '"Your App Name" <noreply@example.com>',
      },
    },
    passwordResetBaseUrl: 'http://localhost:3000',
    auth: {
      whitelist: ['/login'],
      tokenExpiration: 1440 // Token expiration in minutes (default: 24 hours)
    }
  }
})
```

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
      user: 'root',
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
      user: 'postgres',
      password: 'password',
      database: 'myapp'
    }
  }
}
```

## Mailer Configuration

To enable password reset emails, configure the `mailer` option:

### Example using Ethereal Email for testing:

```ts
nuxtUsers: {
  // ... other options
  mailer: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'your-ethereal-user@ethereal.email',
      pass: 'your-ethereal-password',
    },
    defaults: {
      from: '"My Nuxt App" <noreply@example.com>',
    },
  },
  passwordResetBaseUrl: 'http://localhost:3000',
}
```

### Production Mailer Configuration:

```ts
nuxtUsers: {
  // ... other options
  mailer: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password',
    },
    defaults: {
      from: '"Your App" <noreply@yourapp.com>',
    },
  },
  passwordResetBaseUrl: 'https://yourapp.com',
}
```

## Table Names

You can customize table names if needed:

```ts
nuxtUsers: {
  // ... other options
  tables: {
    users: 'my_users',
    personalAccessTokens: 'my_tokens',
    passwordResetTokens: 'my_reset_tokens'
  }
}
```

## Authentication Configuration

Configure authentication behavior with the `auth` option:

```ts
nuxtUsers: {
  // ... other options
  auth: {
    whitelist: ['/login', '/register'], // Routes that don't require authentication
    tokenExpiration: 1440, // Token expiration in minutes (default: 24 hours)
  }
}
```

### Token Expiration

Control how long authentication tokens remain valid:

```ts
nuxtUsers: {
  auth: {
    tokenExpiration: 1440, // 24 hours
  }
}

// Common values:
// 60    - 1 hour
// 1440  - 24 hours (default)
// 10080 - 7 days
// 43200 - 30 days
```

### Route Whitelisting

Specify which routes can be accessed without authentication:

```ts
nuxtUsers: {
  auth: {
    whitelist: [
      '/login',
      '/register', 
      '/about',
      '/contact'
    ]
  }
}
```

## Environment Variables

For production, consider using environment variables:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    connector: {
      name: process.env.DB_TYPE || 'sqlite',
      options: process.env.DB_TYPE === 'mysql' ? {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      } : process.env.DB_TYPE === 'postgresql' ? {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      } : {
        path: process.env.DB_PATH || './data/default.sqlite3'
      }
    },
    mailer: {
      host: process.env.MAILER_HOST,
      port: Number(process.env.MAILER_PORT),
      secure: process.env.MAILER_SECURE === 'true',
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS,
      },
      defaults: {
        from: process.env.MAILER_FROM,
      },
    },
    passwordResetBaseUrl: process.env.PASSWORD_RESET_BASE_URL
  }
})
```

## Default Options

The module comes with sensible defaults:

```ts
const defaultOptions = {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/default.sqlite3',
    },
  },
  tables: {
    users: 'users',
    personalAccessTokens: 'personal_access_tokens',
    passwordResetTokens: 'password_reset_tokens',
  },
  mailer: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'user@ethereal.email',
      pass: 'password',
    },
    defaults: {
      from: '"Nuxt Users Module" <noreply@example.com>',
    },
  },
  passwordResetBaseUrl: 'http://localhost:3000',
  auth: {
    whitelist: ['/login'],
    tokenExpiration: 1440, // Token expiration in minutes (default: 24 hours)
  },
}
```

## Security Enhancements

### Rate Limiting (Recommended)

For production applications, add rate limiting protection:

```bash
npx nuxi module add
```

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users', 'nuxt-api-shield'],
  
  nuxtUsers: {
    // ... your config
  },
  
  apiShield: {
    maxRequests: 5,
    duration: 60000,
    banDuration: 300000,
    routes: ['/api/auth/login', '/api/auth/forgot-password']
  }
})
```

## Next Steps

- [Database Setup](/guide/database-setup) - Learn about database configuration
- [Authentication](/guide/authentication) - Understand the authentication flow
- [Password Reset](/guide/password-reset) - Configure password reset functionality
- [Component Styling](/components/#theme-support) - Learn about theme support and customization