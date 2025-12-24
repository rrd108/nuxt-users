# Localization (i18n)

Nuxt Users comes with built-in support for multiple languages, making it easy to provide a localized experience for your users. The module includes translations for all UI components and labels.

## Supported Languages

Out of the box, Nuxt Users supports:

- **English** (`en`) - Default
- **Hungarian** (`hu`) - Informal variant (tegező)
- **Hungarian Formal** (`hu-formal`) - Formal variant (magázó)

## Quick Start

### Basic Setup

Configure the locale in your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  runtimeConfig: {
    public: {
      nuxtUsers: {
        locale: {
          locale: 'hu',              // Current locale
          fallbackLocale: 'en',      // Fallback when translation missing
        }
      }
    }
  }
})
```

### Using Translations in Components

Use the `useNuxtUsersLocale()` composable to access translations:

```vue
<script setup>
const { t, currentLocale, fallbackLocale } = useNuxtUsersLocale()
</script>

<template>
  <div>
    <h1>{{ t('login.title') }}</h1>
    <p>{{ t('login.subtitle') }}</p>
    
    <!-- With parameters -->
    <p>{{ t('userCard.deleteConfirm', ['John Doe']) }}</p>
    
    <!-- Current locale: {{ currentLocale }} -->
  </div>
</template>
```

## Custom Translations

### Override Existing Translations

You can override default translations or add new ones:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      nuxtUsers: {
        locale: {
          locale: 'en',
          fallbackLocale: 'en',
          texts: {
            en: {
              login: {
                title: 'Sign In',           // Override default
                welcomeBack: 'Welcome!'     // Add new translation
              }
            }
          }
        }
      }
    }
  }
})
```

### Add New Language

Add support for a new language:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      nuxtUsers: {
        locale: {
          locale: 'de',
          fallbackLocale: 'en',
          texts: {
            de: {
              login: {
                title: 'Willkommen zurück',
                subtitle: 'Melden Sie sich in Ihrem Konto an',
                emailLabel: 'E-Mail',
                passwordLabel: 'Passwort',
                submit: 'Anmelden',
                forgotPassword: 'Passwort vergessen?',
                rememberMe: 'Angemeldet bleiben'
              },
              register: {
                title: 'Konto erstellen',
                // ... more translations
              }
            }
          }
        }
      }
    }
  }
})
```

## Translation Keys

### Common Keys

```typescript
common: {
  email: 'Email'
  password: 'Password'
  name: 'Name'
  fullName: 'Full Name'
  role: 'Role'
  active: 'Active'
  yes: 'Yes'
  no: 'No'
  edit: 'Edit'
  delete: 'Delete'
  loading: 'Loading...'
  error: 'Error'
}
```

### Login Form

```typescript
login: {
  title: 'Welcome Back'
  subtitle: 'Sign in to your account'
  emailLabel: 'Email'
  emailPlaceholder: 'Enter your email'
  passwordLabel: 'Password'
  passwordPlaceholder: 'Enter your password'
  rememberMe: 'Remember me'
  submit: 'Sign In'
  submitting: 'Signing in...'
  forgotPassword: 'Forgot your password?'
}
```

### Registration Form

```typescript
register: {
  title: 'Create Account'
  subtitle: 'Sign up for a new account'
  nameLabel: 'Full Name'
  namePlaceholder: 'Enter your full name'
  emailLabel: 'Email'
  emailPlaceholder: 'Enter your email'
  passwordLabel: 'Password'
  confirmPasswordLabel: 'Confirm Password'
  passwordMismatch: 'Passwords do not match'
  submit: 'Create Account'
  submitting: 'Creating Account...'
  alreadyHaveAccount: 'Already have an account?'
  signInLink: 'Sign in here'
}
```

### Password Reset

```typescript
resetPassword: {
  titleReset: 'Reset Password'
  titleChange: 'Change Password'
  currentPasswordLabel: 'Current Password'
  newPasswordLabel: 'New Password'
  confirmPasswordLabel: 'Confirm New Password'
  submitReset: 'Reset Password'
  submitUpdate: 'Update Password'
  submittingReset: 'Resetting...'
  submittingUpdate: 'Updating...'
  passwordHelpText: 'Password must contain at least'
  secureResetInfo: 'You are resetting your password using a secure link.'
  emailLabel: 'Email:'
}
```

### Password Strength

```typescript
passwordStrength: {
  label: 'Password Requirements:'
  strength: {
    weak: 'Weak'
    medium: 'Medium'
    strong: 'Strong'
    veryStrong: 'Very Strong'
  }
  requirements: {
    minLength: 'At least {0} characters'          // {0} is replaced with parameter
    uppercase: 'Contains uppercase letter'
    lowercase: 'Contains lowercase letter'
    numbers: 'Contains number'
    specialChars: 'Contains special character'
  }
}
```

### Email Confirmation

```typescript
emailConfirmation: {
  successTitle: 'Email Confirmed!'
  errorTitle: 'Confirmation Failed'
  loginButton: 'Continue to Login'
  backToLogin: 'Back to Login'
  processing: 'Processing...'
  processingMessage: 'Please wait while we process your email confirmation.'
  successMessage: 'Your email has been confirmed and your account is now active.'
  errorMessage: 'The confirmation link is invalid or has expired.'
}
```

## Parameter Replacement

Use placeholders in translations for dynamic values:

```typescript
// Translation with placeholder
userCard: {
  deleteConfirm: 'Are you sure you want to delete user {0}?'
}

// Usage with parameter
t('userCard.deleteConfirm', ['John Doe'])
// Result: "Are you sure you want to delete user John Doe?"
```

### Multiple Parameters

```typescript
// Translation with multiple placeholders
notification: {
  newMessage: '{0} sent you {1} new message(s)'
}

// Usage
t('notification.newMessage', ['John', 3])
// Result: "John sent you 3 new message(s)"
```

## Hungarian Formal vs Informal

The module provides two Hungarian variants:

### Informal (tegező) - `hu`

Used for casual, friendly communication:

```typescript
login: {
  rememberMe: 'Emlékezz rám'          // informal "you"
  forgotPassword: 'Elfelejtetted...?' // informal
}
```

### Formal (magázó) - `hu-formal`

Used for professional, respectful communication:

```typescript
login: {
  rememberMe: 'Maradjon bejelentkezve'    // formal "you"
  forgotPassword: 'Elfelejtette...?'      // formal
}
```

Both variants share a common base for non-contextual terms (like "Email", "Password") to maintain consistency.

## Composable API

### `useNuxtUsersLocale()`

Returns an object with:

```typescript
{
  t: (key: string, params?: (string | number)[]) => string
  currentLocale: ComputedRef<string>
  fallbackLocale: ComputedRef<string>
}
```

#### `t(key, params?)`

Get a translated string:

```typescript
const { t } = useNuxtUsersLocale()

// Simple translation
const title = t('login.title')

// With parameters
const message = t('userCard.deleteConfirm', ['John'])
```

#### `currentLocale`

Get the current locale:

```typescript
const { currentLocale } = useNuxtUsersLocale()

console.log(currentLocale.value) // 'en', 'hu', etc.
```

#### `fallbackLocale`

Get the fallback locale:

```typescript
const { fallbackLocale } = useNuxtUsersLocale()

console.log(fallbackLocale.value) // 'en'
```

## Best Practices

### 1. Always Use Translation Keys

❌ **Don't** hardcode strings in components:
```vue
<template>
  <h1>Welcome Back</h1>
</template>
```

✅ **Do** use translation keys:
```vue
<script setup>
const { t } = useNuxtUsersLocale()
</script>

<template>
  <h1>{{ t('login.title') }}</h1>
</template>
```

### 2. Provide Fallback Locale

Always configure a fallback locale for missing translations:

```typescript
locale: {
  locale: 'de',
  fallbackLocale: 'en',  // Falls back to English if German translation missing
}
```

### 3. Use Descriptive Keys

Use nested, descriptive keys for better organization:

```typescript
// Good
login.emailPlaceholder
register.passwordMismatch
profile.updateSuccess

// Avoid
email
password
success
```

### 4. Parameter Count Validation

The module validates parameter counts in development mode:

```typescript
// Translation expects 1 parameter
deleteConfirm: 'Delete {0}?'

// Warning in development if count doesn't match
t('deleteConfirm', ['John', 'Extra'])  // Warns about extra parameter
t('deleteConfirm')                      // Warns about missing parameter
```

## Complete Example

Here's a complete example with custom German translations:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  
  runtimeConfig: {
    public: {
      nuxtUsers: {
        locale: {
          locale: 'de',
          fallbackLocale: 'en',
          texts: {
            de: {
              login: {
                title: 'Willkommen zurück',
                subtitle: 'Melden Sie sich an',
                emailLabel: 'E-Mail',
                emailPlaceholder: 'E-Mail eingeben',
                passwordLabel: 'Passwort',
                passwordPlaceholder: 'Passwort eingeben',
                rememberMe: 'Angemeldet bleiben',
                submit: 'Anmelden',
                submitting: 'Anmeldung...',
                forgotPassword: 'Passwort vergessen?'
              },
              register: {
                title: 'Konto erstellen',
                subtitle: 'Registrieren Sie sich',
                nameLabel: 'Vollständiger Name',
                emailLabel: 'E-Mail',
                passwordLabel: 'Passwort',
                confirmPasswordLabel: 'Passwort bestätigen',
                submit: 'Registrieren'
              }
            }
          }
        }
      }
    }
  }
})
```

```vue
<!-- pages/login.vue -->
<script setup>
const { t } = useNuxtUsersLocale()
</script>

<template>
  <div>
    <h1>{{ t('login.title') }}</h1>
    <NUsersLoginForm />
  </div>
</template>
```

## Related

- [Components](./components.md) - All components support localization
- [Configuration](./configuration.md) - Module configuration options
- [Composables](./composables.md) - Available composables
