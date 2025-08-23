# Components

The Nuxt Users module provides several Vue components to help you quickly implement authentication and user management features in your application. These components are designed to work out of the box with minimal configuration while offering extensive customization options.

## Available Components

| Component | Purpose |
|-----------|---------|
| `NUsersLoginForm` | Complete login form with validation and forgot password functionality |
| `NUsersLogoutLink` | Simple logout link with confirmation |
| `NUsersResetPasswordForm` | Password reset form for users with reset tokens |
| `NUsersList` | Paginated list of users with management actions |
| `NUsersUserCard` | Individual user display card with edit/delete actions |
| `NUsersUserForm` | Form for creating and editing user accounts |

## Authentication Components

### NUsersLoginForm

A complete login form with built-in validation, error handling, and forgot password functionality.

#### Basic Usage

```vue
<script setup>
const handleLoginSuccess = (user) => {
  console.log('Login successful:', user)
  // Redirect user or update UI
}

const handleLoginError = (error) => {
  console.log('Login failed:', error)
  // Show error message to user
}
</script>

<template>
  <NUsersLoginForm 
    @success="handleLoginSuccess"
    @error="handleLoginError"
  />
</template>
```

#### Customization Options

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `redirectTo` | `string` | `'/'` | Where to redirect after successful login |

**Events**

| Event | Payload | Description |
|-------|---------|-------------|
| `success` | `User` | Emitted when login is successful |
| `error` | `string` | Emitted when login fails |

**Customization Slots**

The login form provides several slots for customization:

```vue
<NUsersLoginForm>
  <!-- Custom header -->
  <template #header>
    <div class="custom-header">
      <h2>Welcome Back!</h2>
      <p>Sign in to your account</p>
    </div>
  </template>
  
  <!-- Custom submit button -->
  <template #submit-button>
    <FormKit type="submit" class="custom-button">
      Sign In
    </FormKit>
  </template>
  
  <!-- Custom footer with additional links -->
  <template #footer>
    <div class="login-footer">
      <p>Don't have an account? <a href="/signup">Sign up</a></p>
    </div>
  </template>
</NUsersLoginForm>
```

### NUsersLogoutLink

A simple logout component that handles user logout with optional confirmation.

#### Basic Usage

```vue
<script setup>
const handleLogoutSuccess = () => {
  console.log('Logout successful')
  // Handle post-logout actions
}

const handleLogoutError = (error) => {
  console.log('Logout error:', error)
  // Handle logout errors
}
</script>

<template>
  <NUsersLogoutLink 
    @success="handleLogoutSuccess"
    @error="handleLogoutError"
  />
</template>
```

#### Customization Options

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `linkText` | `string` | `'Logout'` | Text displayed in the logout link |
| `redirectTo` | `string` | `'/login'` | Where to redirect after logout |
| `confirmMessage` | `string` | `'Are you sure you want to logout?'` | Confirmation message |
| `class` | `string` | `undefined` | Additional CSS classes |

**Examples**

```vue
<!-- Custom styling and text -->
<NUsersLogoutLink 
  link-text="Sign Out"
  class="custom-logout-btn"
  redirect-to="/home"
/>

<!-- No confirmation dialog -->
<NUsersLogoutLink 
  :confirm-message="null"
  link-text="Quick Logout"
/>
```

### NUsersResetPasswordForm

A form component for users to set a new password using a reset token from their email.

#### Basic Usage

```vue
<template>
  <NUsersResetPasswordForm />
</template>
```

This component automatically:
- Reads the `token` and `email` from URL query parameters
- Validates password confirmation
- Handles API calls for password reset
- Redirects to login page on success
- Displays error messages

## User Management Components

### NUsersList

A comprehensive component for displaying and managing users with pagination, search, and customizable display options.

#### Basic Usage

```vue
<script setup>
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
    <NUsersUserForm 
      v-if="editingUser" 
      :user="editingUser" 
      @submit="handleUserUpdated" 
    />
    <NUsersList 
      ref="userList" 
      @edit-click="handleEdit" 
    />
  </div>
</template>
```

#### Advanced Customization

```vue
<template>
  <NUsersList
    ref="userList"
    :display-fields="['name', 'email', 'role']"
    :field-labels="{ name: 'Full Name', email: 'Email Address', role: 'Access Level' }"
    @edit-click="handleEdit"
    @delete="handleDelete"
  >
    <!-- Custom title -->
    <template #title>
      <h1>Team Members</h1>
    </template>
    
    <!-- Custom user display -->
    <template #user="{ user, index }">
      <div class="custom-user-item">
        <div class="user-info">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <span class="role-badge">{{ user.role }}</span>
        </div>
        <div class="user-actions">
          <button @click="handleEdit(user)" class="edit-btn">
            Edit
          </button>
        </div>
      </div>
    </template>
    
    <!-- Custom pagination -->
    <template #pagination="{ pagination, fetchUsers, loading }">
      <div class="custom-pagination">
        <button 
          :disabled="loading || !pagination.hasPrev" 
          @click="fetchUsers(pagination.page - 1)"
        >
          Previous
        </button>
        <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
        <button 
          :disabled="loading || !pagination.hasNext" 
          @click="fetchUsers(pagination.page + 1)"
        >
          Next
        </button>
      </div>
    </template>
  </NUsersList>
</template>
```

#### Props and Events

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `displayFields` | `string[]` | `['id', 'name', 'email', 'role', 'created_at']` | Fields to display for each user |
| `fieldLabels` | `Record<string, string>` | Default labels | Custom labels for fields |

**Events**

| Event | Payload | Description |
|-------|---------|-------------|
| `editClick` | `User` | Fired when edit button is clicked |
| `delete` | `User` | Fired after successful user deletion |

**Available Slots**

| Slot | Props | Description |
|------|-------|-------------|
| `title` | - | Custom list title |
| `loading` | `{ loading: boolean }` | Custom loading indicator |
| `error` | `{ error: string }` | Custom error display |
| `noUsers` | - | Content when no users found |
| `user` | `{ user: User, index: number }` | Custom user item display |
| `pagination` | `{ pagination, fetchUsers, loading }` | Custom pagination controls |

**Methods**

| Method | Description |
|--------|-------------|
| `refresh()` | Manually refresh the user list |

### NUsersUserCard

Displays individual user information with edit and delete actions. Used internally by `NUsersList` but can be used standalone.

#### Basic Usage

```vue
<script setup>
const user = { 
  id: 1, 
  name: 'Jane Doe', 
  email: 'jane@example.com', 
  role: 'user' 
}

const handleEdit = (user) => {
  console.log('Edit user:', user)
}

const handleDelete = (user) => {
  console.log('User deleted:', user)
}
</script>

<template>
  <NUsersUserCard 
    :user="user" 
    :index="0"
    @edit-click="handleEdit"
    @delete="handleDelete"
  />
</template>
```

#### Customization

```vue
<template>
  <NUsersUserCard
    :user="user"
    :index="0"
    :display-fields="['name', 'role']"
    :field-labels="{ name: 'User Name', role: 'Access Level' }"
  >
    <!-- Completely custom card layout -->
    <template #userCard="{ user }">
      <div class="custom-card">
        <div class="user-avatar">
          <img :src="user.avatar" :alt="user.name" />
        </div>
        <div class="user-details">
          <h4>{{ user.name }}</h4>
          <p>{{ user.email }}</p>
          <span class="role">{{ user.role }}</span>
        </div>
        <div class="user-actions">
          <button @click="handleEdit(user)">Edit</button>
          <button @click="handleDelete(user)">Delete</button>
        </div>
      </div>
    </template>
  </NUsersUserCard>
</template>
```

### NUsersUserForm

A complete form for creating new users or editing existing ones with validation.

#### Creating New Users

```vue
<script setup>
const handleUserCreated = (userData) => {
  console.log('New user created:', userData)
  // Refresh user list or redirect
}
</script>

<template>
  <NUsersUserForm @submit="handleUserCreated" />
</template>
```

#### Editing Existing Users

```vue
<script setup>
import { ref } from 'vue'

const userToEdit = ref({
  id: 1,
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'user'
})

const handleUserUpdated = (userData) => {
  console.log('User updated:', userData)
  userToEdit.value = null // Close form
}
</script>

<template>
  <NUsersUserForm 
    :user="userToEdit" 
    @submit="handleUserUpdated" 
  />
</template>
```

#### Props and Events

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `user` | `User \| null` | `null` | User to edit (null for create mode) |

**Events**

| Event | Payload | Description |
|-------|---------|-------------|
| `submit` | `Partial<User>` | Fired after successful create/update |
| `cancel` | - | Fired when cancel action is triggered |

## Styling and Theming

All components come with a clean, modern design that works without any CSS framework. The components use a consistent design system with CSS custom properties for easy theming.

### Basic Styling

All component styles use the `n-users-` prefix to avoid conflicts with your application styles:

```css
/* Example: Customizing the user list grid */
.n-users-grid {
  gap: 2rem; /* Increase spacing between user cards */
}

/* Example: Styling the delete button */
.n-users-delete-btn {
  background-color: #dc2626;
  border-radius: 6px;
}
```

### Theme Support

The components automatically adapt to light and dark themes based on system preferences. You can also force a specific theme:

#### Force Light Theme

```vue
<template>
  <div class="light">
    <NUsersLoginForm />
  </div>
</template>
```

#### Custom Theme Colors

```vue
<template>
  <div class="custom-theme">
    <NUsersLoginForm />
  </div>
</template>

<style>
.custom-theme {
  --nu-color-primary: #059669;
  --nu-color-primary-dark: #047857;
  --nu-color-bg-primary: #f0fdf4;
  --nu-color-border: #059669;
}
</style>
```

#### Available CSS Custom Properties

| Property | Description | Light Default | Dark Default |
|----------|-------------|---------------|--------------|
| `--nu-color-primary` | Primary brand color | `#3b82f6` | `#60a5fa` |
| `--nu-color-primary-dark` | Darker primary variant | `#2563eb` | `#3b82f6` |
| `--nu-color-bg-primary` | Main background | `#ffffff` | `#111827` |
| `--nu-color-bg-secondary` | Secondary background | `#f9fafb` | `#1f2937` |
| `--nu-color-border` | Border color | `#e5e7eb` | `#374151` |

### Complete Styling Example

```vue
<template>
  <div class="branded-auth">
    <NUsersLoginForm 
      class="branded-login"
      @success="handleSuccess"
    >
      <template #header>
        <div class="brand-header">
          <img src="/logo.png" alt="Company Logo" />
          <h2>Welcome to MyApp</h2>
          <p>Sign in to access your dashboard</p>
        </div>
      </template>
      
      <template #submit-button>
        <FormKit
          type="submit"
          class="brand-button"
        >
          Sign In to MyApp
        </FormKit>
      </template>
    </NUsersLoginForm>
  </div>
</template>

<style scoped>
.branded-auth {
  --nu-color-primary: #7c3aed;
  --nu-color-primary-dark: #6d28d9;
  --nu-color-bg-primary: #faf5ff;
  --nu-color-border: #c4b5fd;
}

.brand-header {
  text-align: center;
  margin-bottom: 2rem;
}

.brand-header img {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.brand-header h2 {
  color: #7c3aed;
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.brand-button {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%) !important;
  border: none !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}
</style>
```

## Next Steps

- **[Getting Started](/user-guide/getting-started)** - Learn how to set up authentication in your app
- **[Configuration](/user-guide/configuration)** - Explore configuration options for components
- **[Authentication](/user-guide/authentication)** - Understand the authentication system
- **[API Reference](/api/)** - Explore available API endpoints