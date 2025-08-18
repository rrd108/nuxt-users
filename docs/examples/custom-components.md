# Custom Components Examples

This guide shows you how to customize the Nuxt Users module components to match your application's design and branding. From simple styling changes to complete component overrides, you'll find practical examples for every customization need.

## Styling Components

### Basic CSS Customization

The components use CSS custom properties for easy theming:

```vue
<!-- pages/login.vue -->
<template>
  <div class="custom-login">
    <NUsersLoginForm @success="handleLogin" />
  </div>
</template>

<style scoped>
.custom-login {
  /* Override component colors */
  --nu-color-primary: #7c3aed;
  --nu-color-primary-dark: #6d28d9;
  --nu-color-bg-primary: #faf5ff;
  --nu-color-border: #c4b5fd;
  
  /* Center the form */
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Style the form container */
.custom-login :deep(.n-users-form) {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}
</style>
```

### Dark Theme Implementation

```vue
<!-- components/DarkLoginForm.vue -->
<template>
  <div class="dark-theme">
    <NUsersLoginForm @success="handleLogin">
      <template #header>
        <div class="dark-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>
      </template>
    </NUsersLoginForm>
  </div>
</template>

<style scoped>
.dark-theme {
  --nu-color-primary: #60a5fa;
  --nu-color-primary-dark: #3b82f6;
  --nu-color-bg-primary: #111827;
  --nu-color-bg-secondary: #1f2937;
  --nu-color-border: #374151;
  --nu-color-text: #f9fafb;
  
  background: #111827;
  color: #f9fafb;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark-header {
  text-align: center;
  margin-bottom: 2rem;
}

.dark-header h2 {
  color: #60a5fa;
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.dark-header p {
  color: #9ca3af;
}
</style>
```

## Component Slot Customization

### Custom Login Form with Branding

```vue
<!-- components/BrandedLoginForm.vue -->
<template>
  <div class="branded-login">
    <NUsersLoginForm @success="handleLogin" @error="handleError">
      <!-- Custom header with logo -->
      <template #header>
        <div class="brand-header">
          <img src="/logo.svg" alt="Company Logo" class="logo" />
          <h1>MyApp</h1>
          <p>Sign in to access your dashboard</p>
        </div>
      </template>
      
      <!-- Custom submit button -->
      <template #submit-button>
        <FormKit
          type="submit"
          class="brand-submit-btn"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Signing in...</span>
          <span v-else>Sign In to MyApp</span>
        </FormKit>
      </template>
      
      <!-- Custom footer with additional links -->
      <template #footer>
        <div class="brand-footer">
          <div class="divider">
            <span>or</span>
          </div>
          <p>Don't have an account? <NuxtLink to="/signup" class="signup-link">Create one</NuxtLink></p>
          <p class="help-text">
            Need help? <a href="/contact" class="help-link">Contact support</a>
          </p>
        </div>
      </template>
    </NUsersLoginForm>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isLoading = ref(false)

const handleLogin = (user) => {
  console.log('Login successful:', user)
  navigateTo('/dashboard')
}

const handleError = (error) => {
  console.error('Login failed:', error)
  isLoading.value = false
}
</script>

<style scoped>
.branded-login {
  --nu-color-primary: #059669;
  --nu-color-primary-dark: #047857;
  
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.brand-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
}

.brand-header h1 {
  color: #059669;
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.brand-header p {
  color: #6b7280;
  font-size: 1rem;
}

.brand-submit-btn {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
  border: none !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 8px !important;
  transition: all 0.2s !important;
}

.brand-submit-btn:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 10px 15px -3px rgba(5, 150, 105, 0.3) !important;
}

.brand-footer {
  margin-top: 2rem;
  text-align: center;
}

.divider {
  position: relative;
  margin: 1.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
}

.divider span {
  background: white;
  padding: 0 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.signup-link {
  color: #059669;
  font-weight: 600;
  text-decoration: none;
}

.signup-link:hover {
  text-decoration: underline;
}

.help-text {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.help-link {
  color: #059669;
  text-decoration: none;
}
</style>
```

### Custom User List with Cards

```vue
<!-- components/UserCardList.vue -->
<template>
  <div class="user-card-list">
    <NUsersList @edit-click="handleEdit" @delete="handleDelete">
      <!-- Custom title -->
      <template #title>
        <div class="list-header">
          <h1>Team Members</h1>
          <button @click="showAddUser = true" class="add-user-btn">
            Add New Member
          </button>
        </div>
      </template>
      
      <!-- Custom user display -->
      <template #user="{ user, index }">
        <div class="user-card">
          <div class="user-avatar">
            <img 
              :src="user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=059669&color=fff`" 
              :alt="user.name"
            />
          </div>
          
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <p class="user-email">{{ user.email }}</p>
            <span class="user-role" :class="`role-${user.role}`">
              {{ user.role }}
            </span>
          </div>
          
          <div class="user-actions">
            <button @click="handleEdit(user)" class="edit-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Edit
            </button>
            
            <button @click="confirmDelete(user)" class="delete-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete
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
            class="pagination-btn"
          >
            ← Previous
          </button>
          
          <div class="pagination-info">
            <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
            <span class="total-users">({{ pagination.total }} total users)</span>
          </div>
          
          <button 
            :disabled="loading || !pagination.hasNext" 
            @click="fetchUsers(pagination.page + 1)"
            class="pagination-btn"
          >
            Next →
          </button>
        </div>
      </template>
    </NUsersList>
    
    <!-- Add user modal -->
    <div v-if="showAddUser" class="modal-overlay" @click="showAddUser = false">
      <div class="modal-content" @click.stop>
        <h2>Add New Team Member</h2>
        <NUsersUserForm @submit="handleUserAdded" @cancel="showAddUser = false" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showAddUser = ref(false)

const handleEdit = (user) => {
  console.log('Edit user:', user)
  // Implement edit logic
}

const handleDelete = (user) => {
  console.log('User deleted:', user)
  // Refresh list or show success message
}

const confirmDelete = (user) => {
  if (confirm(`Are you sure you want to delete ${user.name}?`)) {
    // Call delete API
    handleDelete(user)
  }
}

const handleUserAdded = (userData) => {
  console.log('New user added:', userData)
  showAddUser.value = false
  // Refresh the user list
}
</script>

<style scoped>
.user-card-list {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.list-header h1 {
  color: #111827;
  font-size: 2rem;
  font-weight: 700;
}

.add-user-btn {
  background: #059669;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.add-user-btn:hover {
  background: #047857;
}

.user-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.user-card:hover {
  border-color: #059669;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.user-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.user-email {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.user-role {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-admin {
  background: #fef3c7;
  color: #92400e;
}

.role-user {
  background: #dbeafe;
  color: #1e40af;
}

.role-manager {
  background: #e0e7ff;
  color: #5b21b6;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn, .delete-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.edit-btn:hover {
  border-color: #059669;
  color: #059669;
}

.delete-btn:hover {
  border-color: #dc2626;
  color: #dc2626;
}

.custom-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #059669;
  color: #059669;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  text-align: center;
}

.total-users {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-bottom: 1.5rem;
  color: #111827;
}
</style>
```

## Custom Logout Component

```vue
<!-- components/CustomLogout.vue -->
<template>
  <div class="custom-logout">
    <!-- Simple logout button -->
    <button 
      v-if="variant === 'button'"
      @click="handleLogout" 
      :disabled="isLoading"
      class="logout-btn"
    >
      <svg v-if="!isLoading" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
      </svg>
      <span v-if="isLoading">Logging out...</span>
      <span v-else>{{ buttonText }}</span>
    </button>
    
    <!-- Dropdown menu item -->
    <a 
      v-else-if="variant === 'dropdown'"
      @click="handleLogout"
      class="logout-dropdown-item"
      href="#"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
      </svg>
      {{ buttonText }}
    </a>
    
    <!-- Icon only -->
    <button 
      v-else-if="variant === 'icon'"
      @click="handleLogout"
      :disabled="isLoading"
      class="logout-icon-btn"
      :title="buttonText"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthentication } from '#imports'

const props = defineProps({
  variant: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'dropdown', 'icon'].includes(value)
  },
  buttonText: {
    type: String,
    default: 'Logout'
  },
  redirectTo: {
    type: String,
    default: '/login'
  },
  confirmMessage: {
    type: String,
    default: 'Are you sure you want to logout?'
  }
})

const emit = defineEmits(['success', 'error'])

const { logout } = useAuthentication()
const isLoading = ref(false)

const handleLogout = async () => {
  if (props.confirmMessage && !confirm(props.confirmMessage)) {
    return
  }
  
  isLoading.value = true
  
  try {
    await logout()
    emit('success')
    navigateTo(props.redirectTo)
  } catch (error) {
    console.error('Logout failed:', error)
    emit('error', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover:not(:disabled) {
  background: #b91c1c;
  transform: translateY(-1px);
}

.logout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.logout-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #374151;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.logout-dropdown-item:hover {
  background: #f3f4f6;
  color: #dc2626;
}

.logout-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-icon-btn:hover:not(:disabled) {
  color: #dc2626;
  border-color: #dc2626;
  background: #fef2f2;
}

.logout-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

## Custom Password Reset Form

```vue
<!-- components/CustomPasswordReset.vue -->
<template>
  <div class="custom-password-reset">
    <div class="reset-container">
      <div class="reset-header">
        <h1>Reset Your Password</h1>
        <p>Enter your new password below</p>
      </div>
      
      <NUsersResetPasswordForm @success="handleSuccess" @error="handleError">
        <!-- Custom success message -->
        <template #success>
          <div class="success-message">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" class="success-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h2>Password Reset Successful!</h2>
            <p>Your password has been updated. You can now log in with your new password.</p>
            <NuxtLink to="/login" class="login-link">
              Go to Login
            </NuxtLink>
          </div>
        </template>
        
        <!-- Custom error message -->
        <template #error="{ error }">
          <div class="error-message">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" class="error-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <h2>Reset Failed</h2>
            <p>{{ error }}</p>
            <NuxtLink to="/login" class="retry-link">
              Back to Login
            </NuxtLink>
          </div>
        </template>
      </NUsersResetPasswordForm>
    </div>
  </div>
</template>

<script setup>
const handleSuccess = () => {
  console.log('Password reset successful')
}

const handleError = (error) => {
  console.error('Password reset failed:', error)
}
</script>

<style scoped>
.custom-password-reset {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.reset-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.reset-header {
  text-align: center;
  margin-bottom: 2rem;
}

.reset-header h1 {
  color: #111827;
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.reset-header p {
  color: #6b7280;
}

.success-message, .error-message {
  text-align: center;
  padding: 2rem;
}

.success-icon {
  color: #10b981;
  margin-bottom: 1rem;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 1rem;
}

.success-message h2 {
  color: #10b981;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.error-message h2 {
  color: #ef4444;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.success-message p, .error-message p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.login-link, .retry-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s;
}

.login-link:hover, .retry-link:hover {
  background: #2563eb;
}
</style>
```

## Responsive Design Examples

### Mobile-First Login Form

```vue
<!-- components/MobileLoginForm.vue -->
<template>
  <div class="mobile-login">
    <NUsersLoginForm @success="handleLogin">
      <template #header>
        <div class="mobile-header">
          <img src="/mobile-logo.svg" alt="App Logo" class="mobile-logo" />
          <h1>Welcome</h1>
        </div>
      </template>
    </NUsersLoginForm>
  </div>
</template>

<style scoped>
.mobile-login {
  padding: 1rem;
  min-height: 100vh;
  background: #f9fafb;
}

.mobile-header {
  text-align: center;
  margin-bottom: 2rem;
}

.mobile-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.mobile-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

/* Mobile-specific styles */
@media (max-width: 640px) {
  .mobile-login :deep(.n-users-form) {
    padding: 1.5rem;
    border-radius: 8px;
  }
  
  .mobile-login :deep(.form-input) {
    font-size: 16px; /* Prevents zoom on iOS */
    padding: 0.875rem;
  }
  
  .mobile-login :deep(.submit-button) {
    padding: 1rem;
    font-size: 1.125rem;
  }
}

/* Tablet styles */
@media (min-width: 641px) and (max-width: 1024px) {
  .mobile-login {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .mobile-login :deep(.n-users-form) {
    width: 100%;
    max-width: 400px;
  }
}
</style>
```

## Integration with UI Frameworks

### Tailwind CSS Integration

```vue
<!-- components/TailwindLoginForm.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <NUsersLoginForm @success="handleLogin" class="tailwind-form">
        <template #header>
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Sign in</h2>
            <p class="text-gray-600">Welcome back to your account</p>
          </div>
        </template>
        
        <template #submit-button>
          <FormKit
            type="submit"
            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
          >
            Sign In
          </FormKit>
        </template>
      </NUsersLoginForm>
    </div>
  </div>
</template>

<style>
.tailwind-form {
  @apply bg-white shadow-xl rounded-xl p-8;
}

.tailwind-form .form-input {
  @apply w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent;
}

.tailwind-form .form-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}
</style>
```

## Next Steps

Now that you know how to customize components:

- **[Advanced Configuration](/examples/advanced-configuration)** - Add roles, email, and complex features
- **[Basic Setup](/examples/basic-setup)** - Review fundamental setup patterns
- **[User Guide](/user-guide/)** - Explore all available features
- **[API Reference](/api/)** - Understand the underlying API

## Component Customization Checklist

✅ **Basic Styling**
- [ ] Override CSS custom properties for colors
- [ ] Add custom fonts and typography
- [ ] Implement responsive design

✅ **Slot Customization**
- [ ] Custom headers with branding
- [ ] Custom submit buttons
- [ ] Custom footer content

✅ **Advanced Features**
- [ ] Loading states and animations
- [ ] Error handling and validation
- [ ] Mobile-optimized layouts

✅ **Framework Integration**
- [ ] Tailwind CSS classes
- [ ] Bootstrap components
- [ ] Custom design system

Remember: Always test your customizations across different devices and browsers to ensure a consistent user experience!