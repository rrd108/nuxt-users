# Configuration

The Nuxt Users module is designed to work with zero configuration, but provides extensive customization options when needed. This guide covers all user-facing configuration options to help you tailor the authentication system to your needs.

## Zero-Config Approach (Recommended)

The simplest way to get started is with no configuration at all:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users']
  // That's it! The module works out of the box
})
```

This gives you:
- SQLite database with automatic setup
- Secure password validation
- 24-hour token expiration
- Ready-to-use authentication system

## Complete Configuration Options

When you need more control, here's the full configuration structure:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    // Database configuration
    connector: {
      name: 'sqlite', // 'sqlite' | 'mysql' | 'postgresql'
      options: {
        path: './data/users.sqlite3'
      }
    },
    
    // Custom table names
    tables: {
      users: 'users',
      personalAccessTokens: 'personal_access_tokens',
      passwordResetTokens: 'password_reset_tokens'
    },
    
    // Email configuration for password resets
    mailer: {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'your-email@example.com',
        pass: 'your-password'
      },
      defaults: {
        from: '"Your App" <noreply@example.com>'
      }
    },
    
    // Password reset URL
    passwordResetBaseUrl: 'https://yourapp.com',
    
    // Authentication settings
    auth: {
      whitelist: [], // Routes accessible without authentication
      tokenExpiration: 1440, // Token lifetime in minutes
      permissions: {} // Role-based access control
    },
    
    // Password strength requirements
    passwordValidation: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true
    }
  }
})
```

## Database Configuration

### SQLite (Default)

Perfect for development and small applications:

```ts
nuxtUsers: {
  connector: {
    name: 'sqlite',
    options: {
      path: './data/users.sqlite3' // Database file location
    }
  }
}
```

### MySQL

For production applications with MySQL:

```ts
nuxtUsers: {
  connector: {
    name: 'mysql',
    options: {
      host: 'localhost',
      port: 3306,
      user: 'your_username',
      password: 'your_password',
      database: 'your_database'
    }
  }
}
```

### PostgreSQL

For production applications with PostgreSQL:

```ts
nuxtUsers: {
  connector: {
    name: 'postgresql',
    options: {
      host: 'localhost',
      port: 5432,
      user: 'your_username',
      password: 'your_password',
      database: 'your_database'
    }
  }
}
```

## Email Configuration

Configure email settings to enable password reset functionality:

### Development Setup (Ethereal Email)

For testing during development:

```ts
nuxtUsers: {
  mailer: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'your-test-user@ethereal.email',
      pass: 'your-test-password'
    },
    defaults: {
      from: '"My App" <noreply@example.com>'
    }
  },
  passwordResetBaseUrl: 'http://localhost:3000'
}
```

### Production Setup

For production with Gmail:

```ts
nuxtUsers: {
  mailer: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password' // Use App Password, not regular password
    },
    defaults: {
      from: '"Your App" <noreply@yourapp.com>'
    }
  },
  passwordResetBaseUrl: 'https://yourapp.com'
}
```

### Other Email Providers

The mailer supports any SMTP provider. Common configurations:

```ts
// SendGrid
mailer: {
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: 'your-sendgrid-api-key'
  }
}

// Mailgun
mailer: {
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: 'your-mailgun-username',
    pass: 'your-mailgun-password'
  }
}
```

## Authentication Settings

### Token Expiration

Control how long users stay logged in:

```ts
nuxtUsers: {
  auth: {
    tokenExpiration: 1440 // Minutes (1440 = 24 hours)
  }
}
```

Common values:
- `60` - 1 hour (high security)
- `1440` - 24 hours (default, balanced)
- `10080` - 7 days (convenience)
- `43200` - 30 days (maximum convenience)

### Route Whitelisting

Specify which routes can be accessed without authentication:

```ts
nuxtUsers: {
  auth: {
    whitelist: [
      '/about',
      '/contact',
      '/pricing',
      '/register' // Allow registration page
    ]
  }
}
```

**Note:** Login (`/login`) and password reset routes are always whitelisted automatically.

### Role-Based Access Control (RBAC)

Configure user permissions by role:

```ts
nuxtUsers: {
  auth: {
    permissions: {
      admin: ['*'], // Admin can access everything
      user: ['/profile', '/settings'], // Regular users
      manager: ['/dashboard', '/reports'], // Managers
      
      // Fine-grained API access
      editor: [
        { path: '/api/content/*', methods: ['GET', 'POST', 'PATCH'] }
      ]
    }
  }
}
```

Permission formats:
- `'*'` - Access to everything
- `'/path'` - Exact path match
- `'/path/*'` - Path and all sub-paths
- `{ path: '/api/*', methods: ['GET', 'POST'] }` - Specific HTTP methods

## Password Validation

Configure password strength requirements:

### Default Settings (Recommended)

```ts
nuxtUsers: {
  passwordValidation: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true
  }
}
```

### Relaxed Policy

For applications where convenience is prioritized:

```ts
nuxtUsers: {
  passwordValidation: {
    minLength: 6,
    requireUppercase: false,
    requireLowercase: true,
    requireNumbers: false,
    requireSpecialChars: false,
    preventCommonPasswords: true // Always recommended
  }
}
```

### Strict Policy

For high-security applications:

```ts
nuxtUsers: {
  passwordValidation: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true
  }
}
```

### Password Validation Options

| Option | Description | Default |
|--------|-------------|---------|
| `minLength` | Minimum password length | `8` |
| `requireUppercase` | Require uppercase letters (A-Z) | `true` |
| `requireLowercase` | Require lowercase letters (a-z) | `true` |
| `requireNumbers` | Require numeric digits (0-9) | `true` |
| `requireSpecialChars` | Require special characters (!@#$%^&*) | `true` |
| `preventCommonPasswords` | Block common weak passwords | `true` |

## Custom Table Names

If you need to customize database table names:

```ts
nuxtUsers: {
  tables: {
    users: 'app_users',
    personalAccessTokens: 'app_tokens',
    passwordResetTokens: 'app_reset_tokens'
  }
}
```

## Environment Variables

For production deployments, use environment variables:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    connector: {
      name: process.env.DB_TYPE || 'sqlite',
      options: {
        // SQLite
        ...(process.env.DB_TYPE === 'sqlite' && {
          path: process.env.DB_PATH || './data/users.sqlite3'
        }),
        
        // MySQL/PostgreSQL
        ...(process.env.DB_TYPE !== 'sqlite' && {
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME
        })
      }
    },
    
    mailer: {
      host: process.env.MAILER_HOST,
      port: Number(process.env.MAILER_PORT),
      secure: process.env.MAILER_SECURE === 'true',
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS
      },
      defaults: {
        from: process.env.MAILER_FROM
      }
    },
    
    passwordResetBaseUrl: process.env.PASSWORD_RESET_BASE_URL,
    
    auth: {
      tokenExpiration: Number(process.env.TOKEN_EXPIRATION) || 1440
    }
  }
})
```

### Environment File Example

Create a `.env` file in your project root:

```bash
# Database
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=myapp
DB_PASSWORD=secure_password
DB_NAME=myapp_production

# Email
MAILER_HOST=smtp.gmail.com
MAILER_PORT=587
MAILER_SECURE=false
MAILER_USER=noreply@myapp.com
MAILER_PASS=app_specific_password
MAILER_FROM="My App <noreply@myapp.com>"

# URLs
PASSWORD_RESET_BASE_URL=https://myapp.com

# Auth
TOKEN_EXPIRATION=1440
```

## Configuration Validation

The module validates your configuration and will show helpful error messages if something is wrong:

```bash
# Example validation errors
[nuxt-users] Invalid database connector: 'invalid-db'
[nuxt-users] Missing required mailer configuration for password reset
[nuxt-users] Token expiration must be a positive number
```

## Default Configuration

For reference, here are the complete default settings:

```ts
const defaults = {
  connector: {
    name: 'sqlite',
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
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'user@ethereal.email',
      pass: 'password'
    },
    defaults: {
      from: '"Nuxt Users Module" <noreply@example.com>'
    }
  },
  passwordResetBaseUrl: 'http://localhost:3000',
  auth: {
    whitelist: [],
    tokenExpiration: 1440,
    permissions: {}
  },
  passwordValidation: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true
  }
}
```

## Next Steps

Now that you have your configuration set up:

- [Authentication Guide](/user-guide/authentication) - Learn how users interact with your auth system
- [Components Guide](/user-guide/components) - Customize the provided Vue components
- [Password Reset Guide](/user-guide/password-reset) - Set up password recovery
- [Troubleshooting](/user-guide/troubleshooting) - Common configuration issues and solutions