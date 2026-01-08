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

> **Important**: Even with zero-config, you must install the required peer dependencies (`db0`, `better-sqlite3`, `bcrypt`, `nodemailer`) as described in the [Installation Guide](/user-guide/installation#peer-dependencies).

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
    
    // Password reset URL path
    passwordResetUrl: '/reset-password',
    
    // Authentication settings
    auth: {
      whitelist: [], // Routes accessible without authentication
      tokenExpiration: 1440, // Token lifetime in minutes
      permissions: {} // Role-based access control
    },
    
    // Token cleanup schedule (cron expression)
    // Default: '0 2 * * *' (daily at 2 AM)
    // Set to false or null to disable automatic cleanup
    tokenCleanupSchedule: '0 2 * * *',
    
    // Password strength requirements
    passwordValidation: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true
    },
    
    // User deletion behavior
    hardDelete: false // true = permanent deletion, false = soft delete (default)
  }
})
```

## Runtime Configuration Pattern

As an alternative to top-level `nuxtUsers` configuration, you can use Nuxt's `runtimeConfig` pattern. This approach works for both your Nuxt app runtime and CLI commands (like `npx nuxt-users migrate`).

### Why Use Runtime Config?

- **Environment Variables**: Easier integration with environment variables
- **Security**: Server-side configuration is not exposed to the client
- **Deployment**: Better suited for production deployments
- **CLI Compatibility**: Works seamlessly with CLI commands

### Basic Runtime Config Setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  runtimeConfig: {
    nuxtUsers: {
      connector: {
        name: 'mysql',
        options: {
          host: process.env.NUXT_NUXT_USERS_CONNECTOR_OPTIONS_HOST,
          port: 3306,
          user: process.env.NUXT_NUXT_USERS_CONNECTOR_OPTIONS_USER,
          password: process.env.NUXT_NUXT_USERS_CONNECTOR_OPTIONS_PASSWORD,
          database: process.env.NUXT_NUXT_USERS_CONNECTOR_OPTIONS_DATABASE
        }
      },
      mailer: {
        host: process.env.NUXT_NUXT_USERS_MAILER_HOST,
        port: Number(process.env.NUXT_NUXT_USERS_MAILER_PORT),
        secure: false,
        auth: {
          user: process.env.NUXT_NUXT_USERS_MAILER_AUTH_USER,
          pass: process.env.NUXT_NUXT_USERS_MAILER_AUTH_PASS
        },
        defaults: {
          from: process.env.NUXT_NUXT_USERS_MAILER_DEFAULTS_FROM
        }
      }
    }
  }
})
```

### Environment Variables (.env)

**Environment Variable Naming Convention:**  
For `runtimeConfig.nuxtUsers.*` configuration, environment variables follow the pattern:
`NUXT_NUXT_USERS_[PATH]_[TO]_[PROPERTY]` (uppercase, underscore-separated)

Examples:
- `runtimeConfig.nuxtUsers.connector.options.host` → `NUXT_NUXT_USERS_CONNECTOR_OPTIONS_HOST`
- `runtimeConfig.nuxtUsers.mailer.auth.user` → `NUXT_NUXT_USERS_MAILER_AUTH_USER`

**Important:** Environment variables only override `undefined` values in `runtimeConfig`. If you want environment variables to provide values, set those properties to `undefined` in your config:

```ts
// nuxt.config.ts - Using env vars for sensitive data
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  runtimeConfig: {
    nuxtUsers: {
      connector: {
        name: 'mysql',
        options: {
          host: 'localhost',
          port: 3306,
          database: undefined,  // Will use NUXT_NUXT_USERS_CONNECTOR_OPTIONS_DATABASE
          user: undefined,      // Will use NUXT_NUXT_USERS_CONNECTOR_OPTIONS_USER
          password: undefined   // Will use NUXT_NUXT_USERS_CONNECTOR_OPTIONS_PASSWORD
        }
      }
    }
  }
})
```

**Why `undefined`?** Nuxt's environment variable system only replaces undefined values. Setting empty strings (`''`) or other values will prevent environment variables from being used.

```bash
# Database (follows runtimeConfig.nuxtUsers.connector.options.* pattern)
NUXT_NUXT_USERS_CONNECTOR_OPTIONS_HOST=localhost
NUXT_NUXT_USERS_CONNECTOR_OPTIONS_USER=myapp_user
NUXT_NUXT_USERS_CONNECTOR_OPTIONS_PASSWORD=secure_password  # ⚠️ Must not be purely numeric!
NUXT_NUXT_USERS_CONNECTOR_OPTIONS_DATABASE=myapp_production

# Email (follows runtimeConfig.nuxtUsers.mailer.* pattern)
NUXT_NUXT_USERS_MAILER_HOST=smtp.gmail.com
NUXT_NUXT_USERS_MAILER_PORT=587
NUXT_NUXT_USERS_MAILER_AUTH_USER=noreply@myapp.com
NUXT_NUXT_USERS_MAILER_AUTH_PASS=app_specific_password
NUXT_NUXT_USERS_MAILER_DEFAULTS_FROM="My App <noreply@myapp.com>"
```

### Configuration Precedence

When both configurations are present, the precedence is:

1. **Top-level `nuxtUsers`** (highest priority)
2. **Runtime config `runtimeConfig.nuxtUsers`**
3. **Default values** (lowest priority)

```ts
// Both configurations can coexist
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  // This takes precedence
  nuxtUsers: {
    auth: {
      tokenExpiration: 60 // This overrides runtime config
    }
  },
  
  // This is merged with defaults and overridden by top-level
  runtimeConfig: {
    nuxtUsers: {
      connector: {
        name: 'mysql',
        options: {
          host: process.env.NUXT_NUXT_USERS_CONNECTOR_OPTIONS_HOST,
          // ... other options
        }
      },
      auth: {
        tokenExpiration: 120 // This gets overridden
      }
    }
  }
})
```

### CLI Command Support

By default, the CLI reads `.env` files. If you use `.env.local` or another env file, export variables before running, otherwise `project-info` may show missing values.

```bash
# Using .env.local
set -a; source .env.local; set +a; npx nuxt-users project-info

# Or pass vars inline
DB_CONNECTOR=mysql DB_HOST=localhost DB_USER=myapp DB_PASSWORD=secret DB_NAME=prod npx nuxt-users project-info

# Standard commands
npx nuxt-users migrate
npx nuxt-users create-user -e admin@example.com -n "Admin" -p secure123
```

The CLI will:
1. First try to load your `nuxt.config.ts` configuration
2. Use top-level `nuxtUsers` if present
3. Otherwise use `runtimeConfig.nuxtUsers` if present
4. Fall back to environment variables if no Nuxt config is found

### Runtime Environment Variable Support ✨

**Important Change (v1.34.3+)**: The module now properly supports runtime environment variables for database connections. Previously, database configuration was set at build time, which prevented runtime environment variables from working in production deployments.

**What changed:**
- Database connections are now established at runtime using `useRuntimeConfig()`
- Environment variables are read when the application starts, not when it's built
- The same build can work across multiple environments with different database configs

**Benefits:**
- **Docker compatibility**: Environment variables work properly in containers
- **Security**: Database credentials can be injected at runtime, not baked into builds
- **Flexibility**: Same codebase can connect to different databases per environment
- **CI/CD friendly**: Supports modern deployment practices

**Example deployment scenario:**
```bash
# Same build, different environments
# Development
NUXT_NUXT_USERS_CONNECTOR_OPTIONS_HOST=localhost
NUXT_NUXT_USERS_CONNECTOR_OPTIONS_DATABASE=myapp_dev

# Production
NUXT_NUXT_USERS_CONNECTOR_OPTIONS_HOST=production-db.example.com
NUXT_NUXT_USERS_CONNECTOR_OPTIONS_DATABASE=myapp_production

# The same application build works in both environments!
```

**Important**: This only works with the `runtimeConfig` pattern, not with top-level `nuxtUsers` configuration that uses `process.env` directly.

## Database Sharing with Consumer Apps

- Creating custom tables in the same database
- Performing joins with user tables
- Maintaining data consistency
- Avoiding multiple database connections

### Using `useNuxtUsersDatabase()`

The `useNuxtUsersDatabase()` composable provides server-side access to the module's database connection:

```typescript
// server/api/my-custom-endpoint.get.ts
import { useNuxtUsersDatabase } from '#nuxt-users/server'

export default defineEventHandler(async (event) => {
  const { database, options } = await useNuxtUsersDatabase()
  
  // Use the same database connection as nuxt-users
  const result = await database.sql`
    SELECT u.name, u.email, p.title
    FROM ${options.tables.users} u
    JOIN my_posts p ON u.id = p.user_id
    WHERE u.active = true
  `
  
  return result.rows
})
```

### Creating Custom Tables

```typescript
// server/api/setup-custom-tables.post.ts
import { useNuxtUsersDatabase } from '#nuxt-users/server'

export default defineEventHandler(async (event) => {
  const { database } = await useNuxtUsersDatabase()
  
  // Create your custom table in the same database
  await database.sql`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `
  
  return { success: true }
})
```

### Benefits

- **Single database connection**: No need to configure a separate database
- **Consistent configuration**: Uses the same runtime config as nuxt-users
- **Automatic schema adaptation**: Works with SQLite, MySQL, and PostgreSQL
- **Type safety**: Full TypeScript support
- **Production ready**: Supports all deployment scenarios

## Database Configuration

### SQLite (Default)

Perfect for development and small applications:

> **Required peer dependencies**: `db0`, `better-sqlite3`

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

> **Required peer dependencies**: `db0`, `mysql2`

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

> **⚠️ Important - Numeric Passwords**: If your MySQL password is purely numeric (e.g., `123`, `456`), you **must** use a non-numeric password instead. Nuxt's runtime config automatically converts numeric environment variables to numbers, which causes database connection failures. Either change your database password to include letters (recommended for security), or explicitly cast it to a string in your config: `password: String(process.env.YOUR_PASSWORD_VAR)`. This issue affects MySQL and PostgreSQL connections when using environment variables.

### PostgreSQL

For production applications with PostgreSQL:

> **Required peer dependencies**: `db0`, `pg`

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

> **⚠️ Important - Numeric Passwords**: If your PostgreSQL password is purely numeric (e.g., `123`, `456`), you **must** use a non-numeric password instead. Nuxt's runtime config automatically converts numeric environment variables to numbers, which causes database connection failures. Either change your database password to include letters (recommended for security), or explicitly cast it to a string in your config: `password: String(process.env.YOUR_PASSWORD_VAR)`. This issue affects MySQL and PostgreSQL connections when using environment variables.

## Email Configuration

Configure email settings to enable password reset functionality:

> **Required peer dependency**: `nodemailer` (for all email functionality)

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
  passwordResetUrl: '/reset-password'
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
  passwordResetUrl: '/reset-password'
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

### Token Cleanup Schedule

Configure when expired tokens are automatically cleaned up:

```ts
nuxtUsers: {
  // Run cleanup daily at 2 AM (default)
  tokenCleanupSchedule: '0 2 * * *',
  
  // Or run cleanup every 6 hours
  // tokenCleanupSchedule: '0 */6 * * *',
  
  // Or disable automatic cleanup
  // tokenCleanupSchedule: false,
}
```

**Cron Expression Examples:**
- `'0 2 * * *'` - Daily at 2 AM (default)
- `'0 */6 * * *'` - Every 6 hours
- `'0 0 * * 0'` - Weekly on Sunday at midnight
- `'0 0 1 * *'` - Monthly on the 1st at midnight
- `false` or `null` - Disable automatic cleanup

**Note:** Even if automatic cleanup is disabled, you can still run the cleanup task manually via the Nitro tasks API.

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

**Note:** The following are always accessible without authentication:
- Login page (`/login`)
- Password reset page (default `/reset-password` or your custom `passwordResetUrl`)
- Public API endpoints:
  - `POST /api/nuxt-users/session` (login)
  - `DELETE /api/nuxt-users/session` (logout)
  - `POST /api/nuxt-users/password/forgot` (request password reset)
  - `POST /api/nuxt-users/password/reset` (reset password)

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

## User Deletion Behavior

The module supports two types of user deletion: **soft delete** (default) and **hard delete**.

### Soft Delete (Default - Recommended)

By default, when a user is "deleted", they are actually **soft deleted**:

```ts
nuxtUsers: {
  hardDelete: false // Default behavior
}
```

**What happens during soft delete:**
- User's `active` field is set to `false`
- User record remains in the database
- All user tokens are revoked (user is logged out)
- User cannot log in anymore
- User data is preserved for compliance/audit purposes

**Benefits of soft delete:**
- **Data preservation** - Important for compliance and audit trails
- **Reversible** - Can reactivate users by setting `active: true`
- **Reference integrity** - Foreign keys to user records remain valid
- **Analytics** - Historical data remains available

### Hard Delete (Permanent)

For applications that require permanent user removal:

```ts
nuxtUsers: {
  hardDelete: true // Enable permanent deletion
}
```

**What happens during hard delete:**
- All user tokens are revoked first
- User record is permanently removed from database
- Action cannot be undone
- Any foreign key references will break

**Use cases for hard delete:**
- **GDPR "right to be forgotten"** compliance
- **Data minimization** requirements
- **Storage optimization** for high-volume applications
- **Security-sensitive** applications

### Important Considerations

⚠️ **Before enabling hard delete:**

1. **Check foreign keys** - Ensure your app handles missing user references
2. **Backup strategy** - Have proper backups before permanent deletion
3. **Compliance** - Verify hard delete meets your legal requirements
4. **Audit trail** - Consider logging deletion events separately

### Database Behavior Notes

**SQLite Boolean Handling:**
When using soft delete with SQLite, the `active` field is stored as integers (1 for `true`, 0 for `false`). This is normal SQLite behavior and doesn't affect functionality.

**Cross-database compatibility:**
The module handles boolean values consistently across SQLite, MySQL, and PostgreSQL, but the underlying storage may differ.

### Example Usage

```ts
// Soft delete configuration (default)
nuxtUsers: {
  hardDelete: false,
  // User deletion sets active: false, preserves data
}

// Hard delete configuration 
nuxtUsers: {
  hardDelete: true,
  // User deletion permanently removes record
}
```

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

> **Note**: For a more modern approach, consider using the [Runtime Configuration Pattern](#runtime-configuration-pattern) which provides better integration with Nuxt's built-in environment variable handling.

This section covers two scenarios:
1. **Direct environment variable usage** in your `nuxt.config.ts`
2. **CLI fallback behavior** when no Nuxt configuration is found

### Direct Environment Variable Usage

For production deployments, you can use environment variables directly in your configuration:

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
    
    passwordResetUrl: process.env.PASSWORD_RESET_URL || '/reset-password',
    
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
PASSWORD_RESET_URL=/auth/reset-password

# Auth
TOKEN_EXPIRATION=1440
```

### CLI Fallback Environment Variables

When CLI commands (like `npx nuxt-users migrate`) can't find a `nuxt.config.ts` file or when the configuration is invalid, they fall back to reading these specific environment variables:

```bash
# Database Configuration
DB_CONNECTOR=mysql           # 'sqlite' | 'mysql' | 'postgresql'

# SQLite options
DB_PATH=./data/users.sqlite3  # Path to SQLite database file

# MySQL/PostgreSQL options
DB_HOST=localhost             # Database host
DB_PORT=3306                  # Database port (3306 for MySQL, 5432 for PostgreSQL)
DB_USER=myuser                # Database username
DB_PASSWORD=mypassword        # Database password
DB_NAME=mydatabase            # Database name
```

**Example usage:**

```bash
# Run migration with environment variables (useful in Docker/CI)
DB_CONNECTOR=mysql \
DB_HOST=localhost \
DB_USER=myapp \
DB_PASSWORD=secret123 \
DB_NAME=production \
npx nuxt-users migrate

# Or with SQLite
DB_CONNECTOR=sqlite \
DB_PATH=./production.sqlite3 \
npx nuxt-users migrate
```

**When CLI fallback is used:**
- No `nuxt.config.ts` file exists
- `nuxt.config.ts` file is malformed/invalid
- Neither `nuxtUsers` nor `runtimeConfig.nuxtUsers` configuration is found
- CLI is run outside a Nuxt project

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
      path: './data/users.sqlite3'
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
  passwordResetUrl: '/reset-password',
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