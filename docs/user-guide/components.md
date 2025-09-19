# Components

The Nuxt Users module provides several Vue components to help you quickly implement authentication and user management features in your application. These components are designed to work out of the box with minimal configuration while offering extensive customization options.

## Available Components

| Component | Purpose |
|-----------|---------|
| `NUsersLoginForm` | Complete login form with validation and forgot password functionality |
| `NUsersRegisterForm` | User registration form with email confirmation and password validation |
| `NUsersLogoutLink` | Simple logout link with confirmation |
| `NUsersResetPasswordForm` | Password reset form for users with reset tokens |
| `NUsersList` | Paginated list of users with management actions |
| `NUsersUserCard` | Individual user display card with edit/delete actions |
| `NUsersUserForm` | Form for creating and editing user accounts |
| `NUsersPasswordStrengthIndicator` | Displays real-time password strength feedback (uses `usePasswordValidation` composable) |

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

### NUsersRegisterForm

A complete user registration form with email confirmation, real-time password validation, and built-in error handling.

#### Basic Usage

```vue
<script setup>
const handleRegistrationSuccess = (data) => {
  console.log('Registration successful:', data.user)
  console.log('Message:', data.message)
  // Show success message or redirect
}

const handleRegistrationError = (error) => {
  console.log('Registration failed:', error)
  // Show error message to user
}
</script>

<template>
  <NUsersRegisterForm 
    @success="handleRegistrationSuccess"
    @error="handleRegistrationError"
  />
</template>
```

#### Customization Options

**Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | `'/api/nuxt-users/register'` | Registration API endpoint |
| `redirectTo` | `string` | `undefined` | Where to redirect after successful registration |
| `loginLink` | `string` | `'/login'` | Link to login page |

**Events**

| Event | Payload | Description |
|-------|---------|-------------|
| `success` | `{ user: User, message: string }` | Emitted when registration is successful |
| `error` | `string` | Emitted when registration fails |
| `submit` | `RegistrationFormData` | Emitted when form is submitted |

**Features**

- **Real-time password validation** - Shows strength indicator and requirements
- **Password confirmation** - Ensures passwords match
- **Email validation** - Validates email format
- **Name validation** - Ensures name is provided
- **Form state management** - Handles loading states and validation
- **Email confirmation flow** - Automatically sends confirmation email

**Customization Slots**

The registration form provides several slots for customization:

```vue
<NUsersRegisterForm>
  <!-- Custom header -->
  <template #header>
    <div class="custom-header">
      <h2>Join Our Community</h2>
      <p>Create your account to get started</p>
    </div>
  </template>
  
  <!-- Custom name field -->
  <template #name-field>
    <div class="form-group">
      <label for="fullName">Full Name *</label>
      <input
        id="fullName"
        v-model="formData.name"
        type="text"
        placeholder="Enter your full name"
        required
        class="custom-input"
      >
    </div>
  </template>
  
  <!-- Custom password strength display -->
  <template #password-strength>
    <!-- Use your own password strength component -->
    <CustomPasswordStrength :password="formData.password" />
  </template>
  
  <!-- Custom submit button -->
  <template #submit-button>
    <button
      type="submit"
      :disabled="isLoading || !isFormValid"
      class="custom-register-btn"
    >
      <LoadingSpinner v-if="isLoading" />
      {{ isLoading ? 'Creating Account...' : 'Create My Account' }}
    </button>
  </template>
  
  <!-- Custom footer with links -->
  <template #footer>
    <div class="register-footer">
      <p>Already have an account? <NuxtLink to="/login">Sign in</NuxtLink></p>
      <p class="terms-notice">
        By registering, you agree to our 
        <a href="/terms">Terms of Service</a> and 
        <a href="/privacy">Privacy Policy</a>.
      </p>
    </div>
  </template>
</NUsersRegisterForm>
```

#### Configuration Requirements

To enable registration, you must whitelist the `/register` route in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    auth: {
      whitelist: ['/register'], // This automatically whitelists /confirm-email too
    },
    // Configure email settings for confirmation emails
    mailer: {
      host: 'smtp.your-provider.com',
      port: 587,
      secure: false,
      auth: {
        user: 'your-email@example.com',
        pass: 'your-password'
      },
      defaults: {
        from: '"Your App" <noreply@yourapp.com>'
      }
    }
  }
})
```

**Note:** When you add `/register` to the whitelist, `/confirm-email` is automatically added as well, since users need to access the email confirmation link without authentication.

#### Password Validation

The registration form includes real-time password validation using the `NUsersPasswordStrengthIndicator` component. The validation rules are configurable:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
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
})
```

#### Email Confirmation Flow

1. **User submits registration form** - Email, name, and password are validated
2. **User account created** - Account is created in inactive state
3. **Confirmation email sent** - User receives email with confirmation link
4. **User clicks link** - Account is activated via `/api/nuxt-users/confirm-email`
5. **User can log in** - Account is now active and can be used for login

#### Complete Example

```vue
<template>
  <div class="registration-page">
    <div class="registration-container">
      <NUsersRegisterForm 
        redirect-to="/welcome"
        login-link="/login"
        @success="handleSuccess"
        @error="handleError"
        @submit="handleSubmit"
      >
        <template #header>
          <div class="brand-header">
            <img src="/logo.png" alt="Logo" />
            <h1>Create Your Account</h1>
            <p>Join thousands of satisfied users</p>
          </div>
        </template>
        
        <template #footer>
          <div class="register-footer">
            <p>Already have an account? 
              <NuxtLink to="/login" class="login-link">Sign in here</NuxtLink>
            </p>
            <div class="legal-notice">
              <small>
                By creating an account, you agree to our 
                <a href="/terms">Terms of Service</a> and 
                <a href="/privacy">Privacy Policy</a>.
              </small>
            </div>
          </div>
        </template>
      </NUsersRegisterForm>
    </div>
  </div>
</template>

<script setup>
// SEO and meta
useHead({
  title: 'Register - Your App',
  meta: [
    { name: 'description', content: 'Create a new account to get started with Your App' }
  ]
})

const handleSuccess = (data) => {
  // Show success notification
  console.log('Registration successful:', data)
  // The component will auto-redirect if redirectTo prop is set
}

const handleError = (error) => {
  // Handle error (could show toast notification)
  console.error('Registration error:', error)
}

const handleSubmit = (formData) => {
  // Optional: Track registration attempts
  console.log('Registration attempt:', formData.email)
}
</script>

<style scoped>
.registration-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.registration-container {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.brand-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.brand-header img {
  width: 60px;
  height: 60px;
  margin-bottom: 1rem;
}

.brand-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.register-footer {
  text-align: center;
  padding-top: 1rem;
}

.login-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link:hover {
  text-decoration: underline;
}

.legal-notice {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.legal-notice a {
  color: #6b7280;
  text-decoration: none;
}

.legal-notice a:hover {
  text-decoration: underline;
}
</style>
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
<template>
  <div>
    <NUsersList />
  </div>
</template>
```

#### Advanced Customization

```vue
<script setup>
import { ref } from 'vue'

const { updateUser } = useUsers()

const selectedUser = ref(null)
const handleEditClick = (user) => {
  selectedUser.value = user
}

const handleUserUpdated = async (userData) => {
  selectedUser.value = null
  // Update the user in the local state using the composable - optimistic update
  if (userData.id) {
    updateUser(userData)
  }
  // call the API to update the user
  await $fetch(`/api/nuxt-users/${userData.id}`, {
    method: 'patch',
    body: userData,
  })
}

const handleEdit = (user) => {
  selectedUser.value = user
}

const handleDelete = (user) => {
  // API call is done by the module
  console.log('User deleted:', user)
}
</script>

<template>
    <NUsersUserForm
      v-if="selectedUser"
      :user="selectedUser"
      @submit="handleUserUpdated"
    />

  <NUsersList
    :display-fields="['name', 'email', 'role']"
    :field-labels="{ name: 'Full Name', email: 'Email Address', role: 'Access Level' }"
    @edit-click="handleEdit"
    @delete="handleDelete"
  >
    <!-- Custom title -->
    <template #title>
      <h1>Team Members</h1>
    </template>
    
    <!-- Custom user display - buttons are automatically added below -->
    <template #user="{ user, index }">
      <div class="custom-user-item">
        <div class="user-info">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <span class="role-badge">{{ user.role }}</span>
        </div>
        <!-- Edit and Delete buttons are automatically added here -->
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
| `filter` | `Partial<User> \| ((object: unknown) => boolean)` | `{}` | Filter criteria or function to apply to the user list |

#### Filtering Users

The `NUsersList` component supports two types of filtering:

1. **Object-based filtering** - Filter by user properties using a `Partial<User>` object
2. **Function-based filtering** - Use custom filter functions for complex logic and connected data

**Filter Behavior:**
- **String fields** (name, email, role): Case-insensitive partial matching
- **Other fields** (id, active, etc.): Exact matching
- **Empty values**: Ignored (no filtering applied for that field)
- **Multiple criteria**: All conditions must be met (AND logic)
- **Function filters**: Return `true` to show the user, `false` to hide it

**Object-based Filter Examples:**

```vue
<script setup>
import { ref } from 'vue'

// Filter by role
const roleFilter = ref({ role: 'admin' })

// Filter by name (partial match)
const nameFilter = ref({ name: 'john' })

// Filter by active status
const activeFilter = ref({ active: true })

// Multiple filters
const multiFilter = ref({ 
  role: 'admin', 
  active: true 
})
</script>

<template>
  <!-- Filter by role only -->
  <NUsersList :filter="roleFilter" />
  
  <!-- Filter by name (case-insensitive partial match) -->
  <NUsersList :filter="nameFilter" />
  
  <!-- Filter by active status -->
  <NUsersList :filter="activeFilter" />
  
  <!-- Multiple filters (users must be admin AND active) -->
  <NUsersList :filter="multiFilter" />
</template>
```

**Function-based Filter Examples:**

Function-based filtering is perfect for complex logic and when working with connected data from joined tables:

```vue
<script setup>
import { ref } from 'vue'

// Simple filter: users with credits > 100
const creditsFilter = (obj) => {
  return obj.credits > 100
}

// Complex filter: users with high credits and admin role
const premiumAdminFilter = (obj) => {
  return obj.credits > 100 && obj.role === 'admin'
}

// Filter by connected data (e.g., from joined tables)
const departmentFilter = (obj) => {
  return obj.department?.name === 'Engineering'
}

// Filter by nested properties
const activePremiumFilter = (obj) => {
  return obj.profile?.isActive && obj.credits > 50
}

// Dynamic filter with reactive state
const showHighCredits = ref(false)
const dynamicFilter = (obj) => {
  if (!showHighCredits.value) return true
  return obj.credits > 100
}
</script>

<template>
  <!-- Simple credits filter -->
  <NUsersList :filter="creditsFilter" />
  
  <!-- Complex filter with multiple conditions -->
  <NUsersList :filter="premiumAdminFilter" />
  
  <!-- Filter by connected data -->
  <NUsersList :filter="departmentFilter" />
  
  <!-- Dynamic filter with toggle -->
  <div>
    <button @click="showHighCredits = !showHighCredits">
      {{ showHighCredits ? 'Show All Users' : 'Show High Credits Only' }}
    </button>
    <NUsersList :filter="dynamicFilter" />
  </div>
</template>
```

**Real-world Example with Connected Data:**

```vue
<script setup>
import { ref } from 'vue'

// Example: Users with data from joined tables
// User object might contain: { id, name, email, credits, department: { name, budget }, permissions: [...] }

const showOnlyEngineers = ref(false)
const showOnlyHighCredits = ref(false)

const engineerFilter = (obj) => {
  return obj.department?.name === 'Engineering'
}

const highCreditsFilter = (obj) => {
  return obj.credits > 100
}

const combinedFilter = (obj) => {
  let shouldShow = true
  
  if (showOnlyEngineers.value) {
    shouldShow = shouldShow && obj.department?.name === 'Engineering'
  }
  
  if (showOnlyHighCredits.value) {
    shouldShow = shouldShow && obj.credits > 100
  }
  
  return shouldShow
}
</script>

<template>
  <div>
    <div class="filter-controls">
      <label>
        <input v-model="showOnlyEngineers" type="checkbox">
        Show only Engineers
      </label>
      <label>
        <input v-model="showOnlyHighCredits" type="checkbox">
        Show only High Credits (>100)
      </label>
    </div>
    
    <NUsersList :filter="combinedFilter">
      <template #user="{ user }">
        <div class="user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <p>Credits: {{ user.credits }}</p>
          <p v-if="user.department">Department: {{ user.department.name }}</p>
          <p v-if="user.permissions">Permissions: {{ user.permissions.join(', ') }}</p>
        </div>
      </template>
    </NUsersList>
  </div>
</template>
```

**Dynamic Filtering with User Input:**

```vue
<script setup>
import { ref, computed } from 'vue'

const searchTerm = ref('')
const selectedRole = ref('')
const showActiveOnly = ref(false)

// Computed filter that updates reactively
const filter = computed(() => {
  const filterObj = {}
  
  if (searchTerm.value.trim()) {
    filterObj.name = searchTerm.value
  }
  
  if (selectedRole.value) {
    filterObj.role = selectedRole.value
  }
  
  if (showActiveOnly.value) {
    filterObj.active = true
  }
  
  return filterObj
})

const clearFilters = () => {
  searchTerm.value = ''
  selectedRole.value = ''
  showActiveOnly.value = false
}
</script>

<template>
  <div>
    <!-- Filter Controls -->
    <div class="filter-controls">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Search by name..."
        class="search-input"
      >
      
      <select v-model="selectedRole" class="role-select">
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
        <option value="moderator">Moderator</option>
      </select>
      
      <label class="checkbox-label">
        <input
          v-model="showActiveOnly"
          type="checkbox"
        >
        Active users only
      </label>
      
      <button @click="clearFilters" class="clear-btn">
        Clear Filters
      </button>
    </div>
    
    <!-- User List with Dynamic Filter -->
    <NUsersList 
      :filter="filter"
      @edit-click="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>

<style scoped>
.filter-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  align-items: center;
}

.search-input, .role-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.clear-btn {
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.clear-btn:hover {
  background: #b91c1c;
}
</style>
```

**Advanced Filtering Examples:**

```vue
<script setup>
import { ref } from 'vue'

// Filter by email domain
const emailDomainFilter = ref({ email: '@company.com' })

// Filter by creation date (exact match)
const recentUsersFilter = ref({ 
  created_at: '2024-01-01' 
})

// Filter by multiple name patterns
const namePatterns = ref(['john', 'jane', 'admin'])

const complexFilter = computed(() => {
  // This would require custom logic for OR conditions
  // The built-in filter only supports AND logic
  return { role: 'admin' }
})
</script>

<template>
  <!-- Filter by email domain -->
  <NUsersList :filter="emailDomainFilter" />
  
  <!-- Filter by specific creation date -->
  <NUsersList :filter="recentUsersFilter" />
</template>
```

**Filter with Form Integration:**

```vue
<script setup>
import { ref } from 'vue'

const filterForm = ref({
  name: '',
  email: '',
  role: '',
  active: null
})

const updateFilter = (field, value) => {
  if (value === '' || value === null) {
    // Remove empty filters
    const { [field]: _, ...rest } = filterForm.value
    filterForm.value = rest
  } else {
    filterForm.value = { ...filterForm.value, [field]: value }
  }
}

const resetFilters = () => {
  filterForm.value = {
    name: '',
    email: '',
    role: '',
    active: null
  }
}
</script>

<template>
  <div>
    <!-- Filter Form -->
    <form class="filter-form" @submit.prevent>
      <div class="form-group">
        <label>Name:</label>
        <input
          :value="filterForm.name || ''"
          @input="updateFilter('name', $event.target.value)"
          type="text"
          placeholder="Filter by name..."
        >
      </div>
      
      <div class="form-group">
        <label>Email:</label>
        <input
          :value="filterForm.email || ''"
          @input="updateFilter('email', $event.target.value)"
          type="text"
          placeholder="Filter by email..."
        >
      </div>
      
      <div class="form-group">
        <label>Role:</label>
        <select 
          :value="filterForm.role || ''"
          @change="updateFilter('role', $event.target.value)"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Status:</label>
        <select 
          :value="filterForm.active === null ? '' : filterForm.active"
          @change="updateFilter('active', $event.target.value === '' ? null : $event.target.value === 'true')"
        >
          <option value="">All Users</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>
      
      <button type="button" @click="resetFilters" class="reset-btn">
        Reset Filters
      </button>
    </form>
    
    <!-- Display current filter state -->
    <div class="filter-status">
      <strong>Current Filter:</strong> {{ JSON.stringify(filterForm) }}
    </div>
    
    <!-- User List -->
    <NUsersList 
      :filter="filterForm"
      @edit-click="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
```

**Filter Performance Notes:**

- Filtering is performed client-side on the loaded user data
- For large datasets, consider implementing server-side filtering
- The filter is reactive and updates immediately when the filter prop changes
- Empty filter objects `{}` show all users (no filtering applied)

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
| `user` | `{ user: User, index: number, editUser: Function, deleteUser: Function }` | Custom user item display. Edit/Delete buttons are automatically added below your content, or use the provided functions for manual placement |
| `editButton` | `{ canEdit: boolean, editUser: Function, user: User }` | Custom edit button with permission checks |
| `deleteButton` | `{ canDelete: boolean, deleteUser: Function, user: User }` | Custom delete button with permission checks |
| `pagination` | `{ pagination, fetchUsers, loading }` | Custom pagination controls |

**Events**

| Event | Payload | Description |
|-------|---------|-------------|
| `editClick` | `User` | Fired when edit button is clicked |
| `delete` | `User` | Fired after successful user deletion |

### NUsersUserCard

Displays individual user information with edit and delete actions. Used internally by `NUsersList` but can be used standalone.
The `edit` and `delete` events are emitted when the edit or delete button is clicked. The `delete` event is calling the API to delete the user, while the `edit` event is just emitting the user object and let the parent component handle the edit action.

#### Custom User Slot with Automatic Actions

When using the `user` slot in `NUsersList`, the Edit and Delete buttons are automatically included below your custom content. You have two options:

**Option 1: Simple Custom Display (Recommended)**
The buttons are automatically added below your custom content:

```vue
<template>
  <NUsersList @edit-click="handleEdit" @delete="handleDelete">
    <!-- Custom user display - buttons are automatically added below -->
    <template #user="{ user, index }">
      <div class="custom-user-card">
        <div class="user-avatar">
          <img :src="user.avatar" :alt="user.name" />
        </div>
        <div class="user-details">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <span class="role-badge">{{ user.role }}</span>
        </div>
        <!-- Edit and Delete buttons are automatically added here -->
      </div>
    </template>
  </NUsersList>
</template>
```

**Option 2: Manual Button Placement**
If you want to control where the buttons appear, you can access the provided functions:

```vue
<template>
  <NUsersList @edit-click="handleEdit" @delete="handleDelete">
    <!-- Custom user display with manual button placement -->
    <template #user="{ user, index, editUser, deleteUser }">
      <div class="custom-user-card">
        <div class="user-avatar">
          <img :src="user.avatar" :alt="user.name" />
        </div>
        <div class="user-details">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <span class="role-badge">{{ user.role }}</span>
        </div>
        <div class="user-actions">
          <!-- These functions include permission checks and API calls -->
          <button @click="editUser" class="edit-btn">
            ✏️ Edit
          </button>
          <button @click="deleteUser" class="delete-btn">
            🗑️ Delete
          </button>
        </div>
      </div>
    </template>
  </NUsersList>
</template>
```

**Benefits of the automatic behavior:**
- **Zero configuration** - Buttons appear automatically when using custom slots
- **Permission checks included** - The buttons automatically check if the current user has the required permissions
- **API calls handled** - Delete operations include the API call and confirmation dialog
- **Event emission** - Both functions emit the appropriate events (`editClick`, `delete`) to the parent component
- **Consistent behavior** - Same functionality as the default buttons, ensuring consistent user experience

#### Custom Edit/Delete Buttons

You can also customize just the Edit and Delete buttons while keeping the default user card layout:

```vue
<template>
  <NUsersList @edit-click="handleEdit" @delete="handleDelete">
    <!-- Custom edit button -->
    <template #editButton="{ canEdit, editUser, user }">
      <button 
        v-if="canEdit"
        @click="editUser" 
        class="custom-edit-btn"
      >
        <svg>...</svg>
        Edit User
      </button>
    </template>
    
    <!-- Custom delete button -->
    <template #deleteButton="{ canDelete, deleteUser, user }">
      <button 
        v-if="canDelete"
        @click="deleteUser" 
        class="custom-delete-btn"
      >
        <svg>...</svg>
        Remove User
      </button>
    </template>
  </NUsersList>
</template>
```

### Automatic UI Updates

The `NUsersList` component follows an event-driven pattern for handling user updates. When a user is edited, the component emits events that the parent can handle to update the local state.

**Event Flow:**
1. User clicks edit → `NUsersUserCard` emits `editClick`
2. `NUsersList` forwards the event to parent → Parent receives `editClick`
3. Parent shows edit form → User submits changes
4. Parent updates local state → UI automatically reflects changes

**Example with event-driven updates:**
```vue
<script setup>
import { ref } from 'vue'
import { useUsers } from 'nuxt-users/composables'

const { users, updateUser } = useUsers()
const editingUser = ref(null)

const handleEdit = (user) => {
  editingUser.value = user
}

const handleUserUpdated = (userData) => {
  editingUser.value = null
  // Update the local state using the composable
  if (userData.id) {
    updateUser(userData)
  }
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
      @edit-click="handleEdit" 
    />
  </div>
</template>
```

**Benefits of this approach:**
- **Loose coupling** - Components don't need to know about each other's internal methods
- **Event-driven** - Clean separation of concerns
- **Reusable** - Parent can handle events however it wants
- **Testable** - Easy to test event handling
- **Flexible** - Parent can implement any update strategy

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

## Troubleshooting

### Build-Time Errors

If you encounter build-time errors like this:

```
[Vue Router warn]: uncaught error during route navigation:
ERROR [nuxt] A composable that requires access to the Nuxt instance was called outside of a plugin, Nuxt hook, Nuxt middleware, or Vue setup function.
```

This is a known issue that has been fixed in the module. The error occurs when components use composables that require Nuxt to be available during the build process.

**Solution:** Update to the latest version of the module. If you're still experiencing issues, please report it as a bug.

**Note:** This issue only affects certain components (`NUsersList`, `NUsersUserCard`, `NUsersLogoutLink`, `NUsersProfileInfo`) and has been resolved by implementing lazy initialization of composables.

### Component Not Rendering

If a component is not rendering or appears empty:

1. **Check the console** for any JavaScript errors
2. **Verify the component is properly imported** and registered
3. **Ensure required props are provided** (check the component documentation)
4. **Check that the API endpoints are accessible** and returning data

### Authentication Issues

If authentication components are not working:

1. **Verify your configuration** - Check that `apiBasePath` is correctly set
2. **Check network requests** - Ensure API calls are reaching your server
3. **Review server logs** - Look for any server-side errors
4. **Test with the playground** - Try the components in the module's playground

### NUsersEmailConfirmation

A user-friendly email confirmation page that displays success or error states based on URL parameters. This component is designed to be used on a dedicated confirmation page that users are redirected to after clicking email confirmation links.

#### Basic Usage

```vue
<!-- pages/email-confirmation.vue -->
<template>
  <div>
    <NUsersEmailConfirmation />
  </div>
</template>

<script setup>
// Set page title and meta tags
useHead({
  title: 'Email Confirmation',
  meta: [
    { name: 'description', content: 'Confirm your email address' }
  ]
})
</script>
```

#### Configuration

To enable email confirmation redirects, configure your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    // URL to redirect to after email confirmation
    emailConfirmationUrl: '/email-confirmation',
    auth: {
      // Whitelist the confirmation page
      whitelist: ['/register', '/email-confirmation']
    }
  }
})
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `successTitle` | `string` | `'Email Confirmed!'` | Title for successful confirmation |
| `errorTitle` | `string` | `'Confirmation Failed'` | Title for failed confirmation |
| `loginButtonText` | `string` | `'Continue to Login'` | Text for the login button |
| `loginUrl` | `string` | `'/login'` | URL to redirect to for login |
| `showLoginButton` | `boolean` | `true` | Whether to show the login button |

#### URL Parameters

The component automatically reads these query parameters:
- `status` - Either `'success'` or `'error'`
- `message` - The message to display to the user

#### Customization Slots

```vue
<NUsersEmailConfirmation>
  <!-- Custom success state -->
  <template #success-icon>
    <div class="custom-success-icon">
      🎉
    </div>
  </template>
  
  <template #success-content>
    <h1>Welcome!</h1>
    <p>Your account is ready to use.</p>
  </template>
  
  <template #success-actions>
    <NuxtLink to="/dashboard" class="n-users-btn n-users-btn-primary">
      Go to Dashboard
    </NuxtLink>
  </template>
  
  <!-- Custom error state -->
  <template #error-content>
    <h1>Oops!</h1>
    <p>Something went wrong with your confirmation.</p>
  </template>
</NUsersEmailConfirmation>
```

#### User Experience Flow

1. **User registers** using `NUsersRegisterForm`
2. **Confirmation email sent** with link to `/api/nuxt-users/confirm-email?token=...&email=...`
3. **User clicks link** - API processes the confirmation
4. **API redirects** to `/email-confirmation?status=success&message=...`
5. **User sees friendly page** instead of raw JSON

## Next Steps

- **[Getting Started](/user-guide/getting-started)** - Learn how to set up authentication in your app
- **[Configuration](/user-guide/configuration)** - Explore configuration options for components
- **[Authentication](/user-guide/authentication)** - Understand the authentication system
- **[API Reference](/api/)** - Explore available API endpoints
