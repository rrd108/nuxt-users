# Troubleshooting

This guide covers common issues you might encounter when setting up and using the Nuxt Users module, along with their solutions.

## Installation Issues

### Module Not Found

**Problem:** Getting "Cannot resolve module 'nuxt-users'" error.

**Solution:**
```bash
# Make sure the module is properly installed
npm install nuxt-users

# Clear node_modules and reinstall if needed
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

**Problem:** TypeScript complains about missing types or imports.

**Solution:**
```bash
# Restart your TypeScript server
# In VS Code: Ctrl/Cmd + Shift + P -> "TypeScript: Restart TS Server"

# Make sure your nuxt.config.ts includes the module
export default defineNuxtConfig({
  modules: ['nuxt-users']
})

# Clear Nuxt cache
rm -rf .nuxt
npm run dev
```

## Database Issues

### Database Connection Failed

**Problem:** Getting database connection errors during startup.

**Solutions:**

For **SQLite** (default):
```bash
# Make sure the data directory exists
mkdir -p data

# Check file permissions
ls -la data/
# The SQLite file should be readable/writable
```

For **MySQL**:
```ts
// nuxt.config.ts - Check your connection settings
nuxtUsers: {
  connector: {
    name: 'mysql',
    options: {
      host: 'localhost',     // Verify host is correct
      port: 3306,           // Verify port is correct
      user: 'your_user',    // Verify user exists
      password: 'your_pass', // Verify password is correct
      database: 'your_db'   // Verify database exists
    }
  }
}
```

For **PostgreSQL**:
```ts
// nuxt.config.ts - Check your connection settings
nuxtUsers: {
  connector: {
    name: 'postgresql',
    options: {
      host: 'localhost',     // Verify host is correct
      port: 5432,           // Verify port is correct (default: 5432)
      user: 'your_user',    // Verify user exists
      password: 'your_pass', // Verify password is correct
      database: 'your_db'   // Verify database exists
    }
  }
}
```

### Migration Errors

**Problem:** Database migration commands fail.

**Solutions:**
```bash
# Run migrations step by step to identify the issue
npx nuxt-users create-users-table
npx nuxt-users create-personal-access-tokens-table
npx nuxt-users create-password-reset-tokens-table

# If a specific table fails, check if it already exists
# For SQLite:
sqlite3 data/users.sqlite3 ".tables"

# For MySQL:
mysql -u your_user -p your_database -e "SHOW TABLES;"

# For PostgreSQL:
psql -U your_user -d your_database -c "\dt"
```

### Table Already Exists

**Problem:** Getting "table already exists" errors during migration.

**Solution:**
```bash
# This is usually safe to ignore if the tables are correct
# You can verify table structure matches expectations

# For SQLite:
sqlite3 data/users.sqlite3 ".schema users"

# The module will work with existing tables as long as they have the required columns
```

## Authentication Issues

### Login Always Returns 401

**Problem:** Valid credentials return "Invalid email or password" error.

**Solutions:**

1. **Check if user exists:**
```bash
# List all users to verify the user was created
npx nuxt-users list-users

# Or create a test user
npx nuxt-users create-user test@example.com "Test User" password123
```

2. **Verify password hashing:**
```bash
# Passwords are automatically hashed - don't hash them manually
# ❌ Wrong:
npx nuxt-users create-user user@example.com "User" $(echo -n "password" | bcrypt)

# ✅ Correct:
npx nuxt-users create-user user@example.com "User" password123
```

3. **Check database connection:**
```vue
<!-- Add this to a page to test database connectivity -->
<script setup>
const { data } = await $fetch('/api/nuxt-users/me')
console.log('Database connection test:', data)
</script>
```

### Session Not Persisting

**Problem:** Users get logged out on page refresh.

**Solutions:**

1. **Initialize user on app start:**
```vue
<!-- app.vue or layouts/default.vue -->
<script setup>
import { useAuthentication } from '#imports'

const { initializeUser } = useAuthentication()

// Initialize user from stored session on app start
onMounted(() => {
  initializeUser()
})
</script>
```

2. **Check cookie settings:**
```ts
// nuxt.config.ts - Ensure cookies work in your environment
export default defineNuxtConfig({
  ssr: true, // Server-side rendering helps with cookie handling
  nitro: {
    storage: {
      // Configure session storage if needed
    }
  }
})
```

3. **HTTPS in production:**
```bash
# Cookies require HTTPS in production
# Make sure your production site uses HTTPS
```

### CORS Issues

**Problem:** Getting CORS errors when calling authentication APIs.

**Solution:**
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    cors: {
      origin: ['http://localhost:3000', 'https://yourdomain.com'],
      credentials: true
    }
  }
})
```

## Component Issues

### Components Not Found

**Problem:** `<NUsersLoginForm>` or other components are not recognized.

**Solutions:**

1. **Auto-import should work automatically, but you can import manually:**
```vue
<script setup>
// Manual import if auto-import fails
import { NUsersLoginForm } from '#components'
</script>
```

2. **Clear Nuxt cache:**
```bash
rm -rf .nuxt
npm run dev
```

3. **Check module registration:**
```ts
// nuxt.config.ts - Make sure module is properly registered
export default defineNuxtConfig({
  modules: ['nuxt-users'] // Should be in modules array
})
```

### Component Styling Issues

**Problem:** Components don't match your app's design.

**Solutions:**

1. **Override CSS variables:**
```css
/* assets/css/main.css */
:root {
  --nuxt-users-primary-color: #your-color;
  --nuxt-users-border-radius: 8px;
  --nuxt-users-font-family: 'Your Font', sans-serif;
}
```

2. **Use custom classes:**
```vue
<NUsersLoginForm 
  class="my-custom-login-form"
  input-class="my-input-style"
  button-class="my-button-style"
/>
```

3. **Create custom components:**
```vue
<!-- components/MyLoginForm.vue -->
<template>
  <form @submit.prevent="handleLogin">
    <!-- Your custom form HTML -->
  </form>
</template>

<script setup>
import { useAuthentication } from '#imports'

const { login } = useAuthentication()
// Implement your custom login logic
</script>
```

## Email Issues

### Password Reset Emails Not Sending

**Problem:** Password reset requests succeed but no emails are received.

**Solutions:**

1. **Check email configuration:**
```ts
// nuxt.config.ts
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
  }
}
```

2. **Test email configuration:**

You can test your email configuration by triggering a password reset for a test user. Check your email provider's logs or dashboard to verify emails are being sent correctly.
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

3. **Check spam folder:**
```bash
# Password reset emails might end up in spam
# Check your spam/junk folder
```

4. **Gmail App Passwords:**
```bash
# For Gmail, you need an App Password, not your regular password
# 1. Enable 2-Factor Authentication
# 2. Generate an App Password
# 3. Use the App Password in your config
```

### Email Templates Not Customizing

**Problem:** Can't customize password reset email templates.

**Solution:**
```ts
// nuxt.config.ts
nuxtUsers: {
  mailer: {
    // ... your SMTP config
    templates: {
      passwordReset: {
        subject: 'Reset Your Password - My App',
        html: `
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="{{resetUrl}}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `
      }
    }
  }
}
```

## Performance Issues

### Slow Authentication

**Problem:** Login/logout operations are slow.

**Solutions:**

1. **Database indexing:**
```sql
-- Add indexes for better performance
-- For MySQL/PostgreSQL:
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_personal_access_tokens_token ON personal_access_tokens(token);
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
```

2. **Connection pooling:**
```ts
// nuxt.config.ts - For MySQL/PostgreSQL
nuxtUsers: {
  connector: {
    name: 'mysql',
    options: {
      // ... connection details
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000
    }
  }
}
```

3. **Token cleanup:**
```bash
# Regularly clean up expired tokens
npx nuxt-users cleanup-expired-tokens
```

## Development Issues

### Hot Reload Not Working

**Problem:** Changes to authentication code don't reflect immediately.

**Solution:**
```bash
# Restart the development server
npm run dev

# Clear all caches
rm -rf .nuxt node_modules/.cache
npm run dev
```

### Environment Variables Not Loading

**Problem:** Database or email configuration from `.env` not working.

**Solutions:**

1. **Check .env file location:**
```bash
# .env should be in your project root (same level as nuxt.config.ts)
ls -la .env
```

2. **Verify variable names:**
```bash
# .env
DB_HOST=localhost
DB_PORT=3306
DB_USER=myuser
DB_PASSWORD=mypassword
DB_NAME=mydatabase

MAILER_HOST=smtp.gmail.com
MAILER_PORT=587
MAILER_USER=your-email@gmail.com
MAILER_PASS=your-app-password
```

3. **Use in nuxt.config.ts:**
```ts
export default defineNuxtConfig({
  nuxtUsers: {
    connector: {
      name: 'mysql',
      options: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      }
    }
  }
})
```

## Production Issues

### Authentication Not Working in Production

**Problem:** Authentication works in development but fails in production.

**Solutions:**

1. **HTTPS requirement:**
```bash
# Ensure your production site uses HTTPS
# HTTP-only cookies require HTTPS in production
```

2. **Environment variables:**
```bash
# Make sure all environment variables are set in production
echo $DB_HOST
echo $MAILER_HOST
# etc.
```

3. **Database connectivity:**
```bash
# Test database connection from production server
# For MySQL:
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT 1"

# For PostgreSQL:
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"
```

4. **Build configuration:**
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'node-server', // or your deployment preset
  }
})
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs:**
```bash
# Development
npm run dev
# Look for error messages in the console

# Production
# Check your server logs for detailed error messages
```

2. **Enable debug mode:**
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nuxtUsers: {
    debug: true // Enables detailed logging
  }
})
```

3. **Minimal reproduction:**
```bash
# Create a minimal test case
npx nuxi@latest init test-nuxt-users
cd test-nuxt-users
npm install nuxt-users
# Add minimal configuration and test
```

4. **Community support:**
- Check the [GitHub Issues](https://github.com/your-repo/nuxt-users/issues)
- Search for similar problems
- Create a new issue with:
  - Your configuration
  - Error messages
  - Steps to reproduce
  - Environment details (Node.js version, OS, etc.)

## Common Error Messages

### "Email and password are required"
- **Cause:** Missing email or password in login request
- **Solution:** Ensure both fields are provided and not empty

### "Invalid email or password"
- **Cause:** Incorrect credentials or user doesn't exist
- **Solution:** Verify user exists and password is correct

### "Token expired"
- **Cause:** Authentication token has expired
- **Solution:** User needs to log in again

### "Database connection failed"
- **Cause:** Cannot connect to database
- **Solution:** Check database configuration and connectivity

### "SMTP connection failed"
- **Cause:** Cannot connect to email server
- **Solution:** Verify email configuration and credentials

### "Table 'users' doesn't exist"
- **Cause:** Database tables haven't been created
- **Solution:** Run `npx nuxt-users migrate`

Remember: Most issues are configuration-related. Double-check your `nuxt.config.ts` settings and environment variables first!