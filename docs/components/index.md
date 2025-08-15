# Components

The Nuxt Users module provides several Vue components for authentication and password reset functionality.

## Available Components

| Component | Purpose |
|-----------|---------|
| `NUsersLoginForm` | User login and forgot password form with validation |
| `NUsersLogoutLink` | User logout link with confirmation |
| `NUsersResetPasswordForm` | Password reset form with token validation |
| `NUsersList` | A paginated list of users |
| `NUsersUserCard` | A card to display user information with edit/delete actions |
| `NUsersUserForm` | A form for creating and editing users |

## NUsersList

`NUsersList` is a component that fetches and displays a paginated list of users. It's designed to be flexible, allowing for extensive customization through slots. It internally uses `NUsersUserCard` to display each user, but this can be overridden.

It makes a `GET` request to `/api/nuxt-users` to fetch users and supports pagination via `?page=<number>&limit=<number>` query parameters.

### Basic Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'

const userList = ref(null)
const editingUser = ref(null)

const handleEdit = (user) => {
  editingUser.value = user
}

const handleUserUpdated = () => {
  editingUser.value = null
  userList.value?.refresh()
}
</script>
<template>
  <div>
    <NUsersUserForm v-if="editingUser" :user="editingUser" @submit="handleUserUpdated" />
    <NUsersList ref="userList" @edit-click="handleEdit" />
  </div>
</template>
```

### Advanced Usage

This example demonstrates how to use props to customize the displayed fields and labels, and how to use slots to change the layout and content.

```vue
<template>
  <NUsersList
    ref="userList"
    :display-fields="['id', 'name', 'email']"
    :field-labels="{ name: 'Full Name', email: 'Email Address' }"
    @edit-click="handleEdit"
    @delete="handleDelete"
  >
    <template #title>
      <h1>Our Team Members</h1>
    </template>
    <template #user="{ user, index }">
      <div class="custom-user-item">
        <p>{{ index + 1 }}. {{ user.name }} ({{ user.email }})</p>
        <button @click="handleEdit(user)">Edit {{ user.name }}</button>
      </div>
    </template>
    <template #pagination="{ pagination, fetchUsers, loading }">
      <div class="custom-pagination">
        <button :disabled="loading || !pagination.hasPrev" @click="fetchUsers(pagination.page - 1)">
          Back
        </button>
        <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
        <button :disabled="loading || !pagination.hasNext" @click="fetchUsers(pagination.page + 1)">
          Forward
        </button>
      </div>
    </template>
  </NUsersList>
</template>
<script setup>
  import { ref } from 'vue'
  const userList = ref(null)
  const handleEdit = (user) => console.log('Edit:', user)
  const handleDelete = (user) => {
    console.log('Deleted:', user)
    // The list does not refresh automatically on delete, so we do it manually
    userList.value?.refresh()
  }
</script>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `displayFields` | `string[]` | `['id', 'name', 'email', 'role', 'created_at']` | An array of user fields to display in each card. |
| `fieldLabels` | `Record<string, string>` | `{ id: 'ID', name: 'Name', ... }` | An object to map field names to custom labels. |

### Events

| Event | Payload | Description |
|---|---|---|
| `editClick` | `User` | Fired when the edit button on a user card is clicked. |
| `delete` | `User` | Fired after a user has been successfully deleted via the `NUsersUserCard` component. |

### Slots

| Slot | Props | Description |
|---|---|---|
| `title` | - | Replace the default `<h2>Users List</h2>` title. |
| `loading` | `{ loading: boolean }` | Customize the loading indicator. |
| `error` | `{ error: string | null }` | Customize the error message display. |
| `noUsers` | - | Content to show when no users are found. |
| `usersList` | - | Completely override the rendering of the user list `<ul>`. |
| `user` | `{ user: User, index: number }` | Customize the rendering of a single user item `<li>`. Overrides the default `NUsersUserCard`. |
| `paginationInfo` | `{ pagination: Pagination }` | Customize the pagination summary text. |
| `pagination` | `{ pagination: Pagination, fetchUsers: function, loading: boolean }` | Customize the pagination controls. |

### Exposed Methods

| Method | Description |
|---|---|
| `refresh()` | Programmatically re-fetches the list of users from the server. |

## NUsersUserCard

`NUsersUserCard` displays the details of a single user. It includes buttons for editing and deleting the user, with visibility controlled by the current user's permissions. It's used by default within `NUsersList`.

It makes a `DELETE` request to `/api/nuxt-users/:id` when the delete button is clicked and confirmed.

### Basic Usage

```vue
<template>
  <NUsersUserCard :user="someUser" :index="0" />
</template>
<script setup>
  const someUser = { id: 1, name: 'Jane Doe', email: 'jane@example.com', role: 'user' };
</script>
```

### Advanced Usage

```vue
<template>
  <NUsersUserCard
    :user="someUser"
    :index="0"
    :display-fields="['name', 'role']"
    :field-labels="{ name: 'User Name', role: 'Access Level' }"
    @edit-click="handleEdit"
    @delete="handleDelete"
  >
    <template #userCard="{ user }">
      <div class="custom-card">
        <h4>{{ user.name }}</h4>
        <p>Role: {{ user.role }}</p>
        <div class="n-users-user-card-actions">
          <button @click="handleEdit(user)">Modify</button>
          <button @click="handleDelete(user)">Remove</button>
        </div>
      </div>
    </template>
    <template #editButton>
      <span>Modify User</span>
    </template>
    <template #deleteButton>
      <span>Remove User</span>
    </template>
  </NUsersUserCard>
</template>
<script setup>
  const someUser = { id: 1, name: 'Jane Doe', email: 'jane@example.com', role: 'user' };
  const handleEdit = (user) => console.log('Edit:', user)
  const handleDelete = (user) => console.log('Deleted:', user)
</script>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `user` | `User` | - | **Required.** The user object to display. |
| `index` | `number` | - | **Required.** The index of the user in the list. |
| `displayFields` | `string[]` | `['id', 'name', 'email', 'role', 'created_at']` | An array of user fields to display. |
| `fieldLabels` | `Record<string, string>` | `{ id: 'ID', name: 'Name', ... }` | An object to map field names to custom labels. |

### Events

| Event | Payload | Description |
|---|---|---|
| `editClick` | `User` | Fired when the edit button is clicked. |
| `delete` | `User` | Fired after the user is successfully deleted via the API call. |

### Slots

| Slot | Props | Description |
|---|---|---|
| `userCard` | `{ user: User, index: number }` | Completely override the card's content and structure. |
| `editButton` | - | Customize the content of the edit button. |
| `deleteButton` | - | Customize the content of the delete button. |

## NUsersUserForm

`NUsersUserForm` is a complete form for creating and editing users. It includes validation for name and password strength. When editing, the password field is optional.

- **Create:** Makes a `POST` request to `/api/nuxt-users`.
- **Update:** Makes a `PATCH` request to `/api/nuxt-users/:id`.

### Create User

```vue
<template>
  <NUsersUserForm @submit="handleUserCreated" />
</template>
<script setup>
  const handleUserCreated = (userData) => {
    console.log('User created:', userData)
    // e.g., refresh a user list
  }
</script>
```

### Edit User

```vue
<template>
  <NUsersUserForm :user="userToEdit" @submit="handleUserUpdated" />
</template>
<script setup>
  import { ref } from 'vue'
  const userToEdit = ref({ id: 1, name: 'Jane Doe', email: 'jane@example.com', role: 'user' });
  const handleUserUpdated = (userData) => {
    console.log('User updated:', userData)
    userToEdit.value = null // Close the form
  }
</script>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `user` | `User | null` | `null` | The user object to edit. If `null` or omitted, the form is in "create" mode. |

### Events

| Event | Payload | Description |
|---|---|---|
| `submit` | `Partial<User>` | Fired after a successful create or update API call. |
| `cancel` | - | Fired when a cancel action is triggered. Note: The component has no built-in cancel button. |

### Slots

This component does not have slots for customization.

## NUsersLoginForm

A flexible login form component with Formkit integration.

### Basic Usage

```vue
<template>
  <NUsersLoginForm 
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
| `apiEndpoint` | `string` | `'/api/nuxt-users/session'` | The API endpoint for login requests |
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
<NUsersLoginForm>
  <template #header>
    <div class="custom-header">
      <h2>Welcome to My App</h2>
      <p>Please sign in to continue</p>
    </div>
  </template>
</NUsersLoginForm>
```

#### `email-field`
Customize the email input field.

```vue
<NUsersLoginForm>
  <template #email-field>
    <FormKit
      type="email"
      name="email"
      label="Email Address"
      placeholder="your.email@example.com"
      validation="required|email"
    />
  </template>
</NUsersLoginForm>
```

#### `password-field`
Customize the password input field.

```vue
<NUsersLoginForm>
  <template #password-field>
    <FormKit
      type="password"
      name="password"
      label="Password"
      placeholder="Enter your password"
      validation="required|length:6"
    />
  </template>
</NUsersLoginForm>
```

#### `remember-me`
Customize the remember me checkbox.

```vue
<NUsersLoginForm>
  <template #remember-me>
    <div class="remember-me">
      <FormKit
        type="checkbox"
        name="rememberMe"
        label="Keep me signed in"
      />
    </div>
  </template>
</NUsersLoginForm>
```

#### `submit-button`
Customize the submit button.

```vue
<NUsersLoginForm>
  <template #submit-button>
    <FormKit
      type="submit"
      class="custom-button"
    >
      Sign In to My App
    </FormKit>
  </template>
</NUsersLoginForm>
```

#### `footer`
Customize the form footer (e.g., forgot password link).

```vue
<NUsersLoginForm>
  <template #footer>
    <div class="login-footer">
      <p>Don't have an account? <a href="/signup">Sign up</a></p>
    </div>
  </template>
</NUsersLoginForm>
```

#### `error-message`
Customize how error messages are displayed.

```vue
<NUsersLoginForm>
  <template #error-message="{ error }">
    <div v-if="error" class="custom-error">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
    </div>
  </template>
</NUsersLoginForm>
```

## NUsersLogoutLink

A simple logout link component that handles user logout with confirmation.

### Basic Usage

```vue
<template>
  <NUsersLogoutLink 
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
<NUsersLogoutLink 
  link-text="Sign Out"
  class="custom-logout-link"
/>
```

#### Custom redirect

```vue
<NUsersLogoutLink 
  redirect-to="/home"
  link-text="Exit"
/>
```

#### Custom confirmation

```vue
<NUsersLogoutLink 
  confirm-message="Are you sure you want to sign out of your account?"
  link-text="Sign Out"
/>
```

#### No confirmation

```vue
<template>
  <NUsersLogoutLink 
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

## NUsersResetPasswordForm

A form for users to set a new password using a token from the reset link.

### Basic Usage

```vue
<template>
  <NUsersResetPasswordForm />
</template>
```

This component handles its own API calls, message display, and redirection to login upon success.

### Features

- Automatically reads `token` and `email` from URL query parameters
- Password confirmation validation
- API calls to `/api/nuxt-users/password/reset`
- Automatic redirection to login on success
- Error handling and display

## Styling

All `NUsers*` components share a single, non-scoped stylesheet (`nuxt-users.css`) for a consistent look and feel across the module. The styles are intentionally not scoped to make them easy to override.

All CSS classes used by the components are prefixed with `n-users-` (e.g., `.n-users-list`, `.n-users-user-card`, `.n-users-form-group`) to avoid collisions with your own application's styles.

To customize the appearance, you can override these classes in your own global CSS file. For example, to change the spacing of the user list grid:

```css
/* In your app's global stylesheet */

/* Change the grid gap in the user list */
.n-users-grid {
  gap: 2rem; /* Was 1rem */
}

/* Add a border to the delete button */
.n-users-delete-btn {
  border: 1px solid red;
  border-radius: 5px;
}
```

This approach, combined with the CSS custom properties for theming, gives you full control over the components' appearance.

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
    <NUsersLoginForm />
  </div>
</template>
```

**Option 3: Override CSS custom properties for light theme**

```vue
<template>
  <div class="light-theme">
    <NUsersLoginForm />
  </div>
</template>

<style>
.light-theme {
  /* Primary Colors */
  --nu-color-primary-light: #60a5fa;

  /* Neutral Colors */
  --nu-color-white: #ffffff;
  --nu-color-gray-50: #f9fafb;
  --nu-color-gray-500: #6b7280;
  --nu-color-gray-600: #4b5563;
  --nu-color-gray-700: #374151;
  --nu-color-gray-700: #1f2937;
  --nu-color-gray-900: #111827;

  /* Background Colors */
  --nu-color-bg-primary: #ffffff;
  --nu-color-bg-secondary: #f9fafb;
  --nu-color-bg-tertiary: #f3f4f6;

  /* Border Colors */
  --nu-color-border: #e5e7eb;
  --nu-color-border-light: #d1d5db;
  --nu-color-border-dark: #ccc;
}
</style>
```

**Option 4: Global light theme in your app**

Add this to your global CSS or `app.vue`:

```css
/* Force light theme globally */
:root {
  /* Primary Colors */
  --nu-color-primary-light: #60a5fa;

  /* Neutral Colors */
  --nu-color-white: #ffffff;
  --nu-color-gray-50: #f9fafb;
  --nu-color-gray-500: #6b7280;
  --nu-color-gray-600: #4b5563;
  --nu-color-gray-700: #374151;
  --nu-color-gray-700: #1f2937;
  --nu-color-gray-900: #111827;

  /* Background Colors */
  --nu-color-bg-primary: #ffffff;
  --nu-color-bg-secondary: #f9fafb;
  --nu-color-bg-tertiary: #f3f4f6;

  /* Border Colors */
  --nu-color-border: #e5e7eb;
  --nu-color-border-light: #d1d5db;
  --nu-color-border-dark: #ccc;
}
```

#### Available CSS Custom Properties

The module provides these CSS custom properties that you can override:

| Property | Light Theme Value | Dark Theme Value | Description |
|----------|------------------|------------------|-------------|
| `--nu-color-primary` | `#3b82f6` | `#60a5fa` | Primary brand color |
| `--nu-color-primary-dark` | `#2563eb` | `#3b82f6` | Darker primary variant |
| `--nu-color-primary-light` | `#60a5fa` | `#93c5fd` | Lighter primary variant |
| `--nu-color-bg-primary` | `#ffffff` | `#111827` | Main background color |
| `--nu-color-bg-secondary` | `#f9fafb` | `#1f2937` | Secondary background color |
| `--nu-color-bg-tertiary` | `#f3f4f6` | `#374151` | Tertiary background color |
| `--nu-color-border` | `#e5e7eb` | `#374151` | Default border color |
| `--nu-color-gray-50` | `#f9fafb` | `#111827` | Lightest gray |
| `--nu-color-gray-900` | `#111827` | `#f9fafb` | Darkest gray |

#### Automatic Theme Detection

By default, the components automatically detect the user's system preference using `@media (prefers-color-scheme: light)`. This means:

- If the user's system is set to light mode, the light theme will be applied
- If the user's system is set to dark mode, the dark theme will be applied
- You can override this behavior using the methods above

### Example with Custom Styling

```vue
<template>
  <NUsersLoginForm 
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
  </NUsersLoginForm>
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