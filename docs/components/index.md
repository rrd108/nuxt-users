# Components

The Nuxt Users module provides several Vue components for authentication and password reset functionality.

## Available Components

| Component | Purpose |
|-----------|---------|
| `LoginForm` | User login form with validation |
| `ForgotPasswordForm` | Password reset request form |
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
| `apiEndpoint` | `string` | `'/api/login'` | The API endpoint for login requests |
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

## ForgotPasswordForm

A form for users to request a password reset link.

### Basic Usage

```vue
<template>
  <ForgotPasswordForm />
</template>
```

This component handles its own API calls and message display. It has no specific props or events to configure for basic use.

### Features

- Email validation
- API calls to `/api/forgot-password`
- Success/error message display
- Loading states
- Automatic form reset on success

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
- API calls to `/api/reset-password`
- Automatic redirection to login on success
- Error handling and display

## Styling

All components come with a clean, modern design that works without any CSS framework. You can customize the appearance by:

1. **Using CSS custom properties**: The components use CSS custom properties for colors, spacing, and other design tokens.

2. **Overriding styles**: Use `:deep()` to target Formkit elements and customize their appearance.

3. **Using slots**: Replace any part of the forms with your own custom components.

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

## Dependencies

The components require Formkit to be installed and configured:

```bash
npm install @formkit/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users', '@formkit/nuxt'],
  // ... other config
})
```

## Next Steps

- [Authentication Guide](/guide/authentication) - Learn about the authentication system
- [Password Reset Guide](/guide/password-reset) - Understand password reset functionality
- [API Reference](/api/) - Explore the available API endpoints 