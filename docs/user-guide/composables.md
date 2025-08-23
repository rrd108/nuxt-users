# Composables

Nuxt Users provides several composables to help you interact with the module's functionality in a reactive and idiomatic Nuxt way. These composables encapsulate state management and API interactions, making it easier to build dynamic user interfaces.

## `useUsers()`

The `useUsers` composable provides a reactive way to access and manage the list of users in your application. It handles fetching users from the API and provides methods to update the local state, ensuring your UI stays synchronized.

### Usage

Import `useUsers` in your Vue components or other composables:

```vue
<script setup>
import { useUsers } from 'nuxt-users/composables'

const { users, fetchUsers, loading, error, updateUser, addUser, removeUser } = useUsers()

// Fetch users when the component mounts, if the list is empty
// This ensures the list is populated on initial load or refresh
if (users.value.length === 0) {
  fetchUsers()
}

// Example: Update a user after an API call
const handleUserEdit = async (editedUser) => {
  // Assume you make an API call to save the user first
  // await $fetch(`/api/nuxt-users/${editedUser.id}`, { method: 'PATCH', body: editedUser })
  updateUser(editedUser) // Update local state reactively
}

// Example: Add a new user after an API call
const handleUserAdd = async (newUser) => {
  // Assume you make an API call to create the user first
  // await $fetch('/api/nuxt-users', { method: 'POST', body: newUser })
  addUser(newUser) // Add to local state reactively
}

// Example: Remove a user after an API call
const handleUserRemove = async (userId) => {
  // The removeUser function in the composable already handles the API call
  await removeUser(userId)
}
</script>

<template>
  <div>
    <div v-if="loading">Loading users...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }} ({{ user.email }})
        <button @click="handleUserEdit({ ...user, name: user.name + ' (Edited)' })">Edit Local</button>
        <button @click="handleUserRemove(user.id)">Delete</button>
      </li>
    </ul>
    <button @click="fetchUsers()">Refresh Users</button>
  </div>
</template>
```

### Returned Properties and Methods

The `useUsers` composable returns the following reactive properties and functions:

| Name | Type | Description |
|---|---|---|
| `users` | `Ref<User[]>` | A reactive array containing the list of users. |
| `pagination` | `Ref<Pagination \| null>` | A reactive object containing pagination information (page, limit, total, etc.). |
| `loading` | `Ref<boolean>` | A reactive boolean indicating if data is currently being fetched. |
| `error` | `Ref<string \| null>` | A reactive string containing an error message if fetching fails. |
| `fetchUsers(page?: number, limit?: number)` | `Function` | Fetches users from the API and updates the `users` and `pagination` state. Can take optional `page` and `limit` parameters. |
| `updateUser(updatedUser: User)` | `Function` | Updates a user in the local `users` state. This should typically be called after a successful API update. |
| `addUser(newUser: User)` | `Function` | Adds a new user to the beginning of the local `users` state. This should typically be called after a successful API creation. |
| `removeUser(userId: number)` | `Function` | Deletes a user from the backend via API and then removes them from the local `users` state. |

## `useAuthentication()`

The `useAuthentication` composable provides a reactive way to manage the authentication state of the current user. It handles login, logout, and provides access to the current user's data and authentication status.

### Usage

```vue
<script setup>
import { useAuthentication } from 'nuxt-users/composables'

const { login, user, isAuthenticated } = useAuthentication()

const handleLogin = async (email, password) => {
  try {
    await login(email, password)
    console.log('Login successful:', user.value)
    await navigateTo('/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
  }
}

// Check if user is authenticated
if (isAuthenticated.value) {
  console.log('User is logged in:', user.value)
}

const { logout } = useAuthentication()

const handleLogout = async () => {
  try {
    await logout()
    console.log('Logged out successfully')
    await navigateTo('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>
```

### Returned Properties and Methods

The `useAuthentication` composable returns the following reactive properties and functions:

| Name | Type | Description |
|---|---|---|
| `user` | `Ref<UserWithoutPassword \| null>` | A reactive object containing the current user's data (excluding password), or `null` if not authenticated. |
| `isAuthenticated` | `Ref<boolean>` | A reactive boolean indicating if the user is currently authenticated. |
| `login(email: string, password: string)` | `Function` | Authenticates a user with the provided credentials. |
| `logout()` | `Function` | Logs out the current user, clearing their session. |
| `fetchUser()` | `Function` | Fetches the current user's data from the API and updates the `user` state. |
| `initializeUser()` | `Function` | Initializes the user state, typically by checking local storage and then validating with the server. |

## `usePublicPaths()`

The `usePublicPaths` composable allows you to programmatically determine which paths are accessible to users. This is useful for building dynamic navigation menus, API endpoint lists, or conditional UI elements.

### Usage

```vue
<script setup>
import { usePublicPaths } from 'nuxt-users/composables'

const { getPublicPaths, getAccessiblePaths, isPublicPath, isAccessiblePath } = usePublicPaths()
</script>
```

#### Getting Public Paths

Get all paths that don't require authentication (accessible to everyone):

```js
const publicPaths = getPublicPaths()
console.log(publicPaths)
/*
{
  all: ['/login', '/reset-password', '/api/nuxt-users/session', '/about'],
  builtIn: {
    pages: ['/login', '/reset-password'],
    api: ['/api/nuxt-users/session', '/api/nuxt-users/password/forgot', '/api/nuxt-users/password/reset']
  },
  whitelist: ['/about', '/contact'], // From your nuxt.config.ts
  customPasswordResetPath: null,
  apiBasePath: '/api/nuxt-users'
}
*/
```

#### Getting User-Accessible Paths

Get all paths accessible to the current authenticated user (includes public + role-based paths):

```js
const accessiblePaths = getAccessiblePaths()
console.log(accessiblePaths)
/*
For authenticated user with 'user' role:
{
  all: ['/login', '/about', '/profile', '/dashboard', '/api/nuxt-users/me'],
  public: ['/login', '/reset-password', '/about'],
  roleBasedPaths: ['/profile', '/dashboard', '/api/nuxt-users/me'],
  userRole: 'user'
}
*/
```

#### Checking Individual Paths

Check if specific paths are accessible:

```js
// Check if a path is truly public (no auth required)
console.log(isPublicPath('/login'))     // true
console.log(isPublicPath('/profile'))   // false
console.log(isPublicPath('/about'))     // true (if whitelisted)

// Check if current user can access a path
console.log(isAccessiblePath('/profile'))           // true if user role allows
console.log(isAccessiblePath('/admin'))             // depends on user role
console.log(isAccessiblePath('/api/users', 'POST')) // check specific HTTP method
```

#### Practical Examples

**Building Dynamic Navigation:**

```vue
<template>
  <nav>
    <NuxtLink 
      v-for="item in visibleNavItems" 
      :key="item.path"
      :to="item.path"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<script setup>
const { isAccessiblePath } = usePublicPaths()

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/profile', label: 'Profile' },
  { path: '/admin', label: 'Admin Panel' },
  { path: '/about', label: 'About' }
]

const visibleNavItems = computed(() => 
  allNavItems.filter(item => isAccessiblePath(item.path))
)
</script>
```

**Conditional API Endpoints:**

```vue
<script setup>
const { isAccessiblePath } = usePublicPaths()

const availableActions = computed(() => {
  const actions = []
  
  if (isAccessiblePath('/api/users', 'GET')) {
    actions.push({ label: 'View Users', endpoint: '/api/users', method: 'GET' })
  }
  
  if (isAccessiblePath('/api/users', 'POST')) {
    actions.push({ label: 'Create User', endpoint: '/api/users', method: 'POST' })
  }
  
  return actions
})
</script>
```

**Role-Based UI Components:**

```vue
<template>
  <div>
    <!-- Always visible for public paths -->
    <PublicContent v-if="isPublicPath($route.path)" />
    
    <!-- Only visible if user can access admin routes -->
    <AdminPanel v-if="canAccessAdmin" />
    
    <!-- Conditional buttons based on permissions -->
    <button v-if="canCreateUsers" @click="createUser">
      Create User
    </button>
  </div>
</template>

<script setup>
const { isPublicPath, isAccessiblePath } = usePublicPaths()

const canAccessAdmin = computed(() => 
  isAccessiblePath('/admin')
)

const canCreateUsers = computed(() => 
  isAccessiblePath('/api/users', 'POST')
)
</script>
```

### Returned Properties and Methods

| Method | Description | Returns |
|--------|-------------|----------|
| `getPublicPaths()` | Get all truly public paths (no auth required) | Object with categorized public paths |
| `getAccessiblePaths()` | Get all paths accessible to current user | Object with public + role-based paths |
| `isPublicPath(path)` | Check if a path is public | Boolean |
| `isAccessiblePath(path, method?)` | Check if current user can access path | Boolean |

**Note:** Static assets (files with dots) and Nuxt internal routes (starting with `/_`) are always considered public and accessible.

## `usePasswordValidation()`

The `usePasswordValidation` composable provides utilities for validating password strength and managing password-related UI feedback. It integrates with the module's password validation options.

### Usage

```vue
<script setup>
import { ref, computed } from 'vue'
import { usePasswordValidation } from 'nuxt-users/composables'

const password = ref('')
const { validate, isValid, errors, hints, strength, score, strengthColor, strengthText, clearValidation } = usePasswordValidation()

// Watch for changes in the password input and validate
watch(password, (newPassword) => {
  validate(newPassword)
})

// Example of displaying validation feedback
</script>

<template>
  <div>
    <input type="password" v-model="password" placeholder="Enter password" />
    <div v-if="password.length > 0">
      <p :style="{ color: strengthColor }">Strength: {{ strengthText }} (Score: {{ score }})</p>
      <ul v-if="errors.length">
        <li v-for="error in errors" :key="error" style="color: red;">{{ error }}</li>
      </ul>
      <ul v-if="hints.length">
        <li v-for="hint in hints" :key="hint" style="color: orange;">{{ hint }}</li>
      </ul>
    </div>
    <button @click="clearValidation">Clear Validation</button>
  </div>
</template>
```

### Returned Properties and Methods

The `usePasswordValidation` composable returns the following reactive properties and functions:

| Name | Type | Description |
|---|---|---|
| `password` | `Ref<string>` | A reactive ref that holds the password being validated. |
| `validationResult` | `Ref<PasswordValidationResult \| null>` | A reactive object containing the full validation result (isValid, errors, strength, score, hints). |
| `validate(passwordToValidate: string)` | `Function` | Triggers the password validation for the given string. |
| `isValid` | `Ref<boolean>` | A computed property indicating if the password meets all validation criteria. |
| `errors` | `Ref<string[]>` | A computed array of error messages if validation fails. |
| `hints` | `Ref<string[]>` | A computed array of hints to improve password strength. |
| `strength` | `Ref<'weak' | 'medium' | 'strong'>` | A computed string indicating the password strength. |
| `score` | `Ref<number>` | A computed number (0-100) representing the password strength score. |
| `strengthColor` | `Ref<string>` | A computed CSS color string based on password strength. |
| `strengthText` | `Ref<string>` | A computed text description of password strength. |
| `clearValidation()` | `Function` | Clears the current password and validation results. |