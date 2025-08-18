# Advanced Configuration Examples

This guide covers complex configuration scenarios for the Nuxt Users module, including production deployments, role-based access control, email integration, and multi-database setups.

## Production Deployment Configurations

### Full Production Setup with PostgreSQL

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    // Production database
    connector: {
      name: 'postgresql',
      options: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
    },
    
    // Production email configuration
    mailer: {
      host: process.env.MAILER_HOST,
      port: Number(process.env.MAILER_PORT) || 587,
      secure: process.env.MAILER_SECURE === 'true',
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS
      },
      defaults: {
        from: process.env.MAILER_FROM || '"MyApp" <noreply@myapp.com>'
      }
    },
    
    // Production URLs
    passwordResetBaseUrl: process.env.PASSWORD_RESET_BASE_URL || 'https://myapp.com',
    
    // Security settings
    auth: {
      tokenExpiration: Number(process.env.TOKEN_EXPIRATION) || 1440, // 24 hours
      whitelist: [
        '/',
        '/about',
        '/contact',
        '/pricing',
        '/terms',
        '/privacy'
      ]
    },
    
    // Strong password policy for production
    passwordValidation: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true
    }
  }
})
```

### Environment Variables for Production

```bash
# .env.production
NODE_ENV=production

# Database
DB_HOST=your-postgres-host.com
DB_PORT=5432
DB_USER=myapp_user
DB_PASSWORD=secure_random_password_here
DB_NAME=myapp_production

# Email (SendGrid example)
MAILER_HOST=smtp.sendgrid.net
MAILER_PORT=587
MAILER_SECURE=false
MAILER_USER=apikey
MAILER_PASS=SG.your_sendgrid_api_key_here
MAILER_FROM="MyApp <noreply@myapp.com>"

# URLs
PASSWORD_RESET_BASE_URL=https://myapp.com

# Security
TOKEN_EXPIRATION=1440
JWT_SECRET=your_super_secure_jwt_secret_here
```

### Docker Compose Production Setup

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_USER=myapp
      - DB_PASSWORD=secure_password
      - DB_NAME=myapp_prod
    depends_on:
      - postgres
      - redis
    
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp_prod
      POSTGRES_USER: myapp
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Role-Based Access Control (RBAC)

### Complex Permission System

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    auth: {
      permissions: {
        // Super admin - full access
        'super-admin': ['*'],
        
        // Admin - most access except system settings
        'admin': [
          '/admin/*',
          '/api/users/*',
          '/api/content/*',
          '/api/analytics/*',
          { path: '/api/system/*', methods: ['GET'] } // Read-only system access
        ],
        
        // Manager - user and content management
        'manager': [
          '/admin/users',
          '/admin/content',
          '/api/users/*',
          '/api/content/*',
          { path: '/api/analytics/*', methods: ['GET'] }
        ],
        
        // Editor - content management only
        'editor': [
          '/admin/content',
          '/api/content/*',
          { path: '/api/users/me', methods: ['GET', 'PATCH'] } // Own profile only
        ],
        
        // User - basic access
        'user': [
          '/profile',
          '/settings',
          '/dashboard',
          { path: '/api/users/me', methods: ['GET', 'PATCH'] },
          { path: '/api/content/*', methods: ['GET'] } // Read-only content
        ],
        
        // Guest - very limited access
        'guest': [
          { path: '/api/content/public/*', methods: ['GET'] }
        ]
      }
    }
  }
})
```

### Dynamic Role Assignment

```vue
<!-- pages/admin/users/[id].vue -->
<script setup>
import { useAuthentication } from '#imports'

const route = useRoute()
const { user: currentUser } = useAuthentication()

// Check if current user can manage roles
const canManageRoles = computed(() => {
  return ['super-admin', 'admin'].includes(currentUser.value?.role)
})

const availableRoles = computed(() => {
  if (currentUser.value?.role === 'super-admin') {
    return ['super-admin', 'admin', 'manager', 'editor', 'user', 'guest']
  } else if (currentUser.value?.role === 'admin') {
    return ['manager', 'editor', 'user', 'guest']
  }
  return []
})

const { data: user } = await $fetch(`/api/nuxt-users/${route.params.id}`)

const updateUserRole = async (newRole) => {
  try {
    await $fetch(`/api/nuxt-users/${route.params.id}`, {
      method: 'PATCH',
      body: { role: newRole }
    })
    
    user.value.role = newRole
    console.log('Role updated successfully')
  } catch (error) {
    console.error('Failed to update role:', error)
  }
}
</script>

<template>
  <div class="user-management">
    <h1>Manage User: {{ user.name }}</h1>
    
    <div class="user-details">
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Current Role:</strong> {{ user.role }}</p>
      <p><strong>Created:</strong> {{ new Date(user.created_at).toLocaleDateString() }}</p>
    </div>
    
    <div v-if="canManageRoles" class="role-management">
      <h2>Change Role</h2>
      <select @change="updateUserRole($event.target.value)" :value="user.role">
        <option v-for="role in availableRoles" :key="role" :value="role">
          {{ role.replace('-', ' ').toUpperCase() }}
        </option>
      </select>
    </div>
    
    <div v-else class="no-permission">
      <p>You don't have permission to manage user roles.</p>
    </div>
  </div>
</template>
```

### Middleware for Role-Based Routes

```ts
// middleware/role.ts
import { useAuthentication } from '#imports'

export default defineNuxtRouteMiddleware((to) => {
  const { user, initializeUser } = useAuthentication()
  
  initializeUser()
  
  if (!user.value) {
    return navigateTo('/login')
  }
  
  // Define role requirements for different route patterns
  const roleRequirements = {
    '/admin/system': ['super-admin'],
    '/admin/users': ['super-admin', 'admin', 'manager'],
    '/admin/content': ['super-admin', 'admin', 'manager', 'editor'],
    '/admin': ['super-admin', 'admin', 'manager', 'editor']
  }
  
  // Check if user has required role for this route
  for (const [pattern, requiredRoles] of Object.entries(roleRequirements)) {
    if (to.path.startsWith(pattern)) {
      if (!requiredRoles.includes(user.value.role)) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access Denied: Insufficient permissions'
        })
      }
      break
    }
  }
})
```

## Email Integration Examples

### Advanced Email Configuration with Templates

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    mailer: {
      // Gmail with App Password
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // Use App Password, not regular password
      },
      defaults: {
        from: '"MyApp Support" <support@myapp.com>'
      }
    },
    
    // Custom email templates
    emailTemplates: {
      passwordReset: {
        subject: 'Reset Your MyApp Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Password Reset Request</h1>
            <p>Hello {{name}},</p>
            <p>You requested a password reset for your MyApp account. Click the button below to reset your password:</p>
            <a href="{{resetUrl}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              Reset Password
            </a>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">MyApp Team</p>
          </div>
        `
      },
      
      welcomeEmail: {
        subject: 'Welcome to MyApp!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to MyApp!</h1>
            <p>Hi {{name}},</p>
            <p>Thanks for joining MyApp! Your account has been created successfully.</p>
            <p>You can now log in and start using all our features.</p>
            <a href="{{loginUrl}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
              Login to MyApp
            </a>
            <p>If you have any questions, feel free to contact our support team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">MyApp Team</p>
          </div>
        `
      }
    }
  }
})
```

### Multiple Email Provider Setup

```ts
// nuxt.config.ts - Environment-based email providers
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    mailer: (() => {
      const env = process.env.NODE_ENV
      
      if (env === 'production') {
        // SendGrid for production
        return {
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        }
      } else if (env === 'staging') {
        // Mailgun for staging
        return {
          host: 'smtp.mailgun.org',
          port: 587,
          auth: {
            user: process.env.MAILGUN_SMTP_LOGIN,
            pass: process.env.MAILGUN_SMTP_PASSWORD
          }
        }
      } else {
        // Ethereal for development
        return {
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: process.env.ETHEREAL_USER,
            pass: process.env.ETHEREAL_PASS
          }
        }
      }
    })()
  }
})
```

## Multi-Database and Scaling Configurations

### Database Connection Pooling

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    connector: {
      name: 'postgresql',
      options: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        
        // Connection pooling for high-traffic applications
        pool: {
          min: 2,
          max: 20,
          acquireTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200
        },
        
        // SSL configuration for production
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false,
          ca: process.env.DB_SSL_CA,
          key: process.env.DB_SSL_KEY,
          cert: process.env.DB_SSL_CERT
        } : false
      }
    }
  }
})
```

### Read/Write Database Splitting

```ts
// nuxt.config.ts - Advanced database configuration
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    // Primary database for writes
    connector: {
      name: 'postgresql',
      options: {
        host: process.env.DB_WRITE_HOST,
        port: Number(process.env.DB_WRITE_PORT),
        user: process.env.DB_WRITE_USER,
        password: process.env.DB_WRITE_PASSWORD,
        database: process.env.DB_NAME
      }
    },
    
    // Read replica configuration (if supported)
    readReplica: {
      host: process.env.DB_READ_HOST,
      port: Number(process.env.DB_READ_PORT),
      user: process.env.DB_READ_USER,
      password: process.env.DB_READ_PASSWORD,
      database: process.env.DB_NAME
    }
  }
})
```

## Security Hardening

### Enhanced Security Configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    // Strong password requirements
    passwordValidation: {
      minLength: 14,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true,
      preventUserInfoInPassword: true, // Prevent name/email in password
      maxLength: 128 // Prevent DoS attacks with very long passwords
    },
    
    // Security settings
    auth: {
      tokenExpiration: 480, // 8 hours for high-security applications
      maxLoginAttempts: 3,
      lockoutDuration: 900, // 15 minutes lockout after failed attempts
      requireEmailVerification: true,
      sessionTimeout: 30, // Auto-logout after 30 minutes of inactivity
      
      // IP-based restrictions
      allowedIPs: process.env.ALLOWED_IPS?.split(',') || [],
      blockedIPs: process.env.BLOCKED_IPS?.split(',') || [],
      
      // Rate limiting
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 requests per windowMs
        message: 'Too many login attempts, please try again later'
      }
    },
    
    // Audit logging
    auditLog: {
      enabled: true,
      events: ['login', 'logout', 'password_change', 'role_change', 'failed_login'],
      retention: 90 // Keep logs for 90 days
    }
  }
})
```

### Two-Factor Authentication Setup

```vue
<!-- components/TwoFactorAuth.vue -->
<script setup>
import { ref } from 'vue'

const props = defineProps({
  user: Object,
  required: true
})

const totpCode = ref('')
const qrCodeUrl = ref('')
const backupCodes = ref([])
const isEnabled = ref(false)

const generateQRCode = async () => {
  try {
    const response = await $fetch('/api/auth/2fa/generate', {
      method: 'POST'
    })
    
    qrCodeUrl.value = response.qrCode
    backupCodes.value = response.backupCodes
  } catch (error) {
    console.error('Failed to generate 2FA:', error)
  }
}

const enable2FA = async () => {
  try {
    await $fetch('/api/auth/2fa/enable', {
      method: 'POST',
      body: { token: totpCode.value }
    })
    
    isEnabled.value = true
    console.log('2FA enabled successfully')
  } catch (error) {
    console.error('Failed to enable 2FA:', error)
  }
}

const disable2FA = async () => {
  try {
    await $fetch('/api/auth/2fa/disable', {
      method: 'POST',
      body: { token: totpCode.value }
    })
    
    isEnabled.value = false
    console.log('2FA disabled successfully')
  } catch (error) {
    console.error('Failed to disable 2FA:', error)
  }
}

onMounted(async () => {
  // Check if 2FA is already enabled
  try {
    const status = await $fetch('/api/auth/2fa/status')
    isEnabled.value = status.enabled
  } catch (error) {
    console.error('Failed to check 2FA status:', error)
  }
})
</script>

<template>
  <div class="two-factor-auth">
    <h2>Two-Factor Authentication</h2>
    
    <div v-if="!isEnabled" class="enable-2fa">
      <p>Enhance your account security with two-factor authentication.</p>
      
      <button @click="generateQRCode" class="generate-btn">
        Set Up 2FA
      </button>
      
      <div v-if="qrCodeUrl" class="qr-setup">
        <h3>Scan QR Code</h3>
        <img :src="qrCodeUrl" alt="2FA QR Code" />
        
        <h3>Backup Codes</h3>
        <div class="backup-codes">
          <p>Save these backup codes in a safe place:</p>
          <ul>
            <li v-for="code in backupCodes" :key="code">{{ code }}</li>
          </ul>
        </div>
        
        <div class="verify-setup">
          <label>Enter verification code:</label>
          <input v-model="totpCode" type="text" placeholder="000000" />
          <button @click="enable2FA">Enable 2FA</button>
        </div>
      </div>
    </div>
    
    <div v-else class="manage-2fa">
      <p>✅ Two-factor authentication is enabled</p>
      
      <div class="disable-2fa">
        <label>Enter verification code to disable:</label>
        <input v-model="totpCode" type="text" placeholder="000000" />
        <button @click="disable2FA" class="danger-btn">Disable 2FA</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.two-factor-auth {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
}

.qr-setup {
  margin-top: 2rem;
  text-align: center;
}

.qr-setup img {
  margin: 1rem 0;
}

.backup-codes {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.backup-codes ul {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.backup-codes li {
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  text-align: center;
}

.verify-setup {
  margin-top: 2rem;
}

.verify-setup input {
  display: block;
  width: 100%;
  padding: 0.75rem;
  margin: 0.5rem 0;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
  font-family: monospace;
  font-size: 1.25rem;
}

.generate-btn, .verify-setup button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.danger-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
</style>
```

## Performance Optimization

### Caching and Session Management

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  nuxtUsers: {
    // Redis for session storage in production
    sessionStore: process.env.NODE_ENV === 'production' ? {
      type: 'redis',
      options: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: 0
      }
    } : {
      type: 'memory' // Use memory store for development
    },
    
    // Performance settings
    performance: {
      // Cache user data for faster lookups
      userCacheTTL: 300, // 5 minutes
      
      // Batch database operations
      batchSize: 100,
      
      // Connection pooling
      maxConnections: 20,
      
      // Query optimization
      enableQueryCache: true,
      queryCacheTTL: 60 // 1 minute
    }
  }
})
```

## Monitoring and Analytics

### User Activity Tracking

```vue
<!-- composables/useUserAnalytics.ts -->
<script setup>
export const useUserAnalytics = () => {
  const trackUserAction = async (action, metadata = {}) => {
    try {
      await $fetch('/api/analytics/track', {
        method: 'POST',
        body: {
          action,
          metadata,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      })
    } catch (error) {
      console.error('Failed to track user action:', error)
    }
  }
  
  const trackPageView = (page) => {
    trackUserAction('page_view', { page })
  }
  
  const trackLogin = (method = 'password') => {
    trackUserAction('login', { method })
  }
  
  const trackLogout = () => {
    trackUserAction('logout')
  }
  
  return {
    trackUserAction,
    trackPageView,
    trackLogin,
    trackLogout
  }
}
</script>
```

## Next Steps

With these advanced configurations, you can:

- **[Basic Setup](/examples/basic-setup)** - Review fundamental patterns
- **[Custom Components](/examples/custom-components)** - Customize the UI
- **[User Guide](/user-guide/)** - Explore all features
- **[Developer Guide](/developer-guide/)** - Contribute to the module

## Configuration Checklist

✅ **Production Ready**
- [ ] Environment variables configured
- [ ] Database connection pooling enabled
- [ ] SSL/TLS certificates configured
- [ ] Email provider set up

✅ **Security Hardened**
- [ ] Strong password policies
- [ ] Rate limiting enabled
- [ ] Audit logging configured
- [ ] Two-factor authentication (optional)

✅ **Performance Optimized**
- [ ] Redis session storage
- [ ] Database query caching
- [ ] Connection pooling
- [ ] Monitoring and analytics

✅ **Scalability Prepared**
- [ ] Load balancer configuration
- [ ] Database read replicas
- [ ] CDN for static assets
- [ ] Horizontal scaling ready

Remember to test all configurations in a staging environment before deploying to production!