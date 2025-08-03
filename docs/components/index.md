# Components

The Nuxt Users module provides several Vue components for authentication and password reset functionality.

## Available Components

| Component | Purpose |
|-----------|---------|
| `LoginForm` | User login and forgot password form with validation |
| `LogoutLink` | User logout link with confirmation |
| `ResetPasswordForm` | Password reset form with token validation |

## LoginForm

A flexible login form component with Formkit integration.

### Basic Usage

```vue
<template>
  <LoginForm 
    @success="handleSuccess"
    @error="handleError"
  />
</template>

<script setup>
const handleSuccess = (user) => {
  console.log('Login successful:', user)
  // Redirect or update UI
}

const handleError = (error) => {
  console.log('Login error:', error)
  // Show error message
}
</script>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | `'/api/auth/login'` | The API endpoint for login requests |
| `redirectTo` | `string` | `'/'` | Where to redirect after successful login |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `success` | `User` | Emitted when login is successful |
| `error` | `string` | Emitted when login fails |
| `submit` | `LoginFormData` | Emitted when form is submitted |

### Slots

The component provides several slots for customization:

#### `header`
Customize the form header (title and subtitle).

```vue
<LoginForm>
  <template #header>
    <div class="custom-header">
      <h2>Welcome to My App</h2>
      <p>Please sign in to continue</p>
    </div>
  </template>
</LoginForm>
```

#### `email-field`
Customize the email input field.

```vue
<LoginForm>
  <template #email-field>
    <FormKit
      type="email"
      name="email"
      label="Email Address"
      placeholder="your.email@example.com"
      validation="required|email"
    />
  </template>
</LoginForm>
```

#### `password-field`
Customize the password input field.

```vue
<LoginForm>
  <template #password-field>
    <FormKit
      type="password"
      name="password"
      label="Password"
      placeholder="Enter your password"
      validation="required|length:6"
    />
  </template>
</LoginForm>
```

#### `remember-me`
Customize the remember me checkbox.

```vue
<LoginForm>
  <template #remember-me>
    <div class="remember-me">
      <FormKit
        type="checkbox"
        name="rememberMe"
        label="Keep me signed in"
      />
    </div>
  </template>
</LoginForm>
```

#### `submit-button`
Customize the submit button.

```vue
<LoginForm>
  <template #submit-button>
    <FormKit
      type="submit"
      class="custom-button"
    >
      Sign In to My App
    </FormKit>
  </template>
</LoginForm>
```

#### `footer`
Customize the form footer (e.g., forgot password link).

```vue
<LoginForm>
  <template #footer>
    <div class="login-footer">
      <p>Don't have an account? <a href="/signup">Sign up</a></p>
    </div>
  </template>
</LoginForm>
```

#### `error-message`
Customize how error messages are displayed.

```vue
<LoginForm>
  <template #error-message="{ error }">
    <div v-if="error" class="custom-error">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
    </div>
  </template>
</LoginForm>
```

## LogoutLink

A simple logout link component that handles user logout with confirmation.

### Basic Usage

```vue
<template>
  <LogoutLink 
    @success="handleSuccess"
    @error="handleError"
  />
</template>

<script setup>
const handleSuccess = () => {
  console.log('Logout successful')
  // Handle successful logout
}

const handleError = (error) => {
  console.log('Logout error:', error)
  // Show error message
}
</script>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `linkText` | `string` | `'Logout'` | The text to display in the link |
| `redirectTo` | `string` | `'/login'` | Where to redirect after successful logout |
| `confirmMessage` | `string` | `'Are you sure you want to logout?'` | Confirmation message before logout |
| `class` | `string` | `undefined` | Additional CSS classes for styling |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `success` | `void` | Emitted when logout is successful |
| `error` | `string` | Emitted when logout fails |
| `click` | `void` | Emitted when the link is clicked |

### Customization Examples

#### Custom styling

```vue
<LogoutLink 
  link-text="Sign Out"
  class="custom-logout-link"
/>
```

#### Custom redirect

```vue
<LogoutLink 
  redirect-to="/home"
  link-text="Exit"
/>
```

#### Custom confirmation

```vue
<LogoutLink 
  confirm-message="Are you sure you want to sign out of your account?"
  link-text="Sign Out"
/>
```

#### No confirmation

```vue
<template>
  <LogoutLink 
    :confirm-message="null"
    link-text="Quick Logout"
  />
</template>
```

### Manual Logout

You can also implement logout manually using the `useAuthentication` composable:

```vue
<template>
  <button @click="handleLogout" :disabled="isLoading">
    {{ isLoading ? 'Logging out...' : 'Logout' }}
  </button>
</template>

<script setup>
const { logout } = useAuthentication()
const isLoading = ref(false)

const handleLogout = async () => {
  if (!confirm('Are you sure you want to logout?')) {
    return
  }
  
  isLoading.value = true
  try {
    await logout()
    // Handle successful logout
  } catch (error) {
    // Handle error
  } finally {
    isLoading.value = false
  }
}
</script>
```

## ResetPasswordForm

A form for users to set a new password using a token from the reset link.

### Basic Usage

```vue
<template>
  <ResetPasswordForm />
</template>
```

This component handles its own API calls, message display, and redirection to login upon success.

### Features

- Automatically reads `token` and `email` from URL query parameters
- Password confirmation validation
- API calls to `/api/auth/reset-password`
- Automatic redirection to login on success
- Error handling and display

## Styling

All components come with a clean, modern design that works without any CSS framework. You can customize the appearance by:

1. **Using CSS custom properties**: The components use CSS custom properties for colors, spacing, and other design tokens.

2. **Overriding styles**: Use `:deep()` to target Formkit elements and customize their appearance.

3. **Using slots**: Replace any part of the forms with your own custom components.

### Theme Support

The module includes built-in theme support with automatic light/dark mode detection. The components use CSS custom properties that automatically adapt based on the user's system preference.

#### Using Light Theme

To force the light theme in your consuming Nuxt app, you can:

**Option 1: Add the `light` class to your app root**

```vue
<template>
  <div class="light">
    <NuxtPage />
  </div>
</template>
```

**Option 2: Add the `light` class to a specific container**

```vue
<template>
  <div class="light">
    <LoginForm />
  </div>
</template>
```

**Option 3: Override CSS custom properties for light theme**

```vue
<template>
  <div class="light-theme">
    <LoginForm />
  </div>
</template>

<style>
.light-theme {
  /* Primary Colors */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-primary-light: #60a5fa;

  /* Secondary Colors */
  --color-secondary: #059669;
  --color-secondary-dark: #047857;
  --color-secondary-light: #10b981;

  /* Neutral Colors */
  --color-white: #ffffff;
  --color-black: #000000;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Background Colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;

  /* Border Colors */
  --color-border: #e5e7eb;
  --color-border-light: #d1d5db;
  --color-border-dark: #ccc;
}
</style>
```

**Option 4: Global light theme in your app**

Add this to your global CSS or `app.vue`:

```css
/* Force light theme globally */
:root {
  /* Primary Colors */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-primary-light: #60a5fa;

  /* Secondary Colors */
  --color-secondary: #059669;
  --color-secondary-dark: #047857;
  --color-secondary-light: #10b981;

  /* Neutral Colors */
  --color-white: #ffffff;
  --color-black: #000000;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Background Colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;

  /* Border Colors */
  --color-border: #e5e7eb;
  --color-border-light: #d1d5db;
  --color-border-dark: #ccc;
}
```

#### Available CSS Custom Properties

The module provides these CSS custom properties that you can override:

| Property | Light Theme Value | Dark Theme Value | Description |
|----------|------------------|------------------|-------------|
| `--color-primary` | `#3b82f6` | `#60a5fa` | Primary brand color |
| `--color-primary-dark` | `#2563eb` | `#3b82f6` | Darker primary variant |
| `--color-primary-light` | `#60a5fa` | `#93c5fd` | Lighter primary variant |
| `--color-secondary` | `#059669` | `#10b981` | Secondary brand color |
| `--color-bg-primary` | `#ffffff` | `#111827` | Main background color |
| `--color-bg-secondary` | `#f9fafb` | `#1f2937` | Secondary background color |
| `--color-bg-tertiary` | `#f3f4f6` | `#374151` | Tertiary background color |
| `--color-border` | `#e5e7eb` | `#374151` | Default border color |
| `--color-gray-50` | `#f9fafb` | `#111827` | Lightest gray |
| `--color-gray-900` | `#111827` | `#f9fafb` | Darkest gray |

#### Automatic Theme Detection

By default, the components automatically detect the user's system preference using `@media (prefers-color-scheme: light)`. This means:

- If the user's system is set to light mode, the light theme will be applied
- If the user's system is set to dark mode, the dark theme will be applied
- You can override this behavior using the methods above

### Example with Custom Styling

```vue
<template>
  <LoginForm 
    class="my-login-form"
    @success="handleSuccess"
  >
    <template #header>
      <div class="branded-header">
        <h2>Welcome to MyApp</h2>
        <p>Sign in to access your dashboard</p>
      </div>
    </template>
    
    <template #submit-button>
      <FormKit
        type="submit"
        class="branded-button"
      >
        Sign In
      </FormKit>
    </template>
  </LoginForm>
</template>

<style scoped>
.my-login-form {
  --fk-border-color: #059669;
  --fk-border-color-focus: #047857;
  --fk-bg-color: #f0fdf4;
}

.branded-header h2 {
  color: #059669;
  font-size: 2rem;
  font-weight: 700;
}

.branded-button {
  background-color: #059669 !important;
  border-color: #059669 !important;
  font-weight: 600 !important;
}

.branded-button:hover:not(:disabled) {
  background-color: #047857 !important;
  border-color: #047857 !important;
}
</style>
```

## Next Steps

- [Authentication Guide](/guide/authentication) - Learn about the authentication system
- [Password Reset Guide](/guide/password-reset) - Understand password reset functionality
- [API Reference](/api/) - Explore the available API endpoints