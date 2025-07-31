<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { User, ModuleOptions } from '../../types'
import { usePasswordValidation } from '../composables/usePasswordValidation'
import { useRuntimeConfig } from '#imports'
import PasswordStrengthIndicator from './PasswordStrengthIndicator.vue'

interface ProfileFormProps {
  apiEndpoint?: string
  updatePasswordEndpoint?: string
}

interface Emits {
  (e: 'success', user: User): void
  (e: 'error' | 'password-error', error: string): void
  (e: 'password-updated'): void
}

const props = withDefaults(defineProps<ProfileFormProps>(), {
  apiEndpoint: '/api/profile',
  updatePasswordEndpoint: '/api/profile/update-password'
})

const emit = defineEmits<Emits>()

const isLoading = ref(false)
const isPasswordLoading = ref(false)
const error = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')

const user = ref<User | null>(null)

// Password form data
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: ''
})

// Get module options for password validation
const { public: { nuxtUsers } } = useRuntimeConfig()
const moduleOptions = nuxtUsers as ModuleOptions

// Password validation
const passwordValidation = usePasswordValidation(moduleOptions)

// Watch for password changes and validate
watch(() => passwordForm.value.newPassword, (newPassword) => {
  if (newPassword) {
    passwordValidation.validate(newPassword)
  }
  else {
    passwordValidation.clearValidation()
  }
})

// Load user profile
const loadProfile = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const response = await $fetch<{ user: User }>(props.apiEndpoint, {
      method: 'GET'
    })

    user.value = response.user
    emit('success', response.user)
  }
  catch (err: unknown) {
    const errorMessage = err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'statusMessage' in err.data
      ? String(err.data.statusMessage)
      : err instanceof Error
        ? err.message
        : 'Failed to load profile'
    error.value = errorMessage
    emit('error', errorMessage)
  }
  finally {
    isLoading.value = false
  }
}

// Update password
const updatePassword = async () => {
  isPasswordLoading.value = true
  passwordError.value = ''
  passwordSuccess.value = ''

  try {
    await $fetch(props.updatePasswordEndpoint, {
      method: 'POST',
      body: passwordForm.value
    })

    passwordSuccess.value = 'Password updated successfully'
    emit('password-updated')

    // Clear form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirmation: ''
    }
  }
  catch (err: unknown) {
    const errorMessage = err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'statusMessage' in err.data
      ? String(err.data.statusMessage)
      : err instanceof Error
        ? err.message
        : 'Failed to update password'
    passwordError.value = errorMessage
    emit('password-error', errorMessage)
  }
  finally {
    isPasswordLoading.value = false
  }
}

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="profile-form">
    <!-- Profile Information Section -->
    <div class="profile-section">
      <h2 class="section-title">
        Profile Information
      </h2>

      <div
        v-if="isLoading"
        class="loading"
      >
        Loading profile...
      </div>

      <div
        v-else-if="error"
        class="error-message"
      >
        {{ error }}
      </div>

      <div
        v-else-if="user"
        class="profile-info"
      >
        <div class="info-row">
          <label class="info-label">Name:</label>
          <span class="info-value">{{ user.name }}</span>
        </div>

        <div class="info-row">
          <label class="info-label">Email:</label>
          <span class="info-value">{{ user.email }}</span>
        </div>

        <div class="info-row">
          <label class="info-label">Role:</label>
          <span class="info-value">{{ user.role }}</span>
        </div>

        <div class="info-row">
          <label class="info-label">Member since:</label>
          <span class="info-value">{{ formatDate(user.created_at) }}</span>
        </div>

        <div class="info-row">
          <label class="info-label">Last updated:</label>
          <span class="info-value">{{ formatDate(user.updated_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Change Password Section -->
    <div class="password-section">
      <h2 class="section-title">
        Change Password
      </h2>

      <form
        class="password-form"
        @submit.prevent="updatePassword"
      >
        <div class="form-group">
          <label
            for="currentPassword"
            class="form-label"
          >Current Password</label>
          <input
            id="currentPassword"
            v-model="passwordForm.currentPassword"
            type="password"
            class="form-input"
            required
            :disabled="isPasswordLoading"
          >
        </div>

        <div class="form-group">
          <label
            for="newPassword"
            class="form-label"
          >New Password</label>
          <input
            id="newPassword"
            v-model="passwordForm.newPassword"
            type="password"
            class="form-input"
            required
            :minlength="moduleOptions.passwordValidation?.minLength || 8"
            :class="{ error: passwordValidation.errors.value.length > 0 && passwordForm.newPassword }"
            :disabled="isPasswordLoading"
          >

          <PasswordStrengthIndicator
            :password="passwordForm.newPassword"
            :validation-result="passwordValidation.validationResult.value"
          />

          <!-- Password requirements -->
          <small class="form-help">
            Password must contain at least {{ moduleOptions.passwordValidation?.minLength || 8 }} characters
            <span v-if="moduleOptions.passwordValidation?.requireUppercase">, including uppercase letters</span>
            <span v-if="moduleOptions.passwordValidation?.requireLowercase">, lowercase letters</span>
            <span v-if="moduleOptions.passwordValidation?.requireNumbers">, numbers</span>
            <span v-if="moduleOptions.passwordValidation?.requireSpecialChars">, and special characters</span>.
          </small>
        </div>

        <div class="form-group">
          <label
            for="newPasswordConfirmation"
            class="form-label"
          >Confirm New Password</label>
          <input
            id="newPasswordConfirmation"
            v-model="passwordForm.newPasswordConfirmation"
            type="password"
            class="form-input"
            required
            :disabled="isPasswordLoading"
          >
        </div>

        <div
          v-if="passwordError"
          class="error-message"
        >
          {{ passwordError }}
        </div>

        <div
          v-if="passwordSuccess"
          class="success-message"
        >
          {{ passwordSuccess }}
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isPasswordLoading"
        >
          <span v-if="isPasswordLoading">Updating...</span>
          <span v-else>Update Password</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.profile-section,
.password-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.loading {
  text-align: center;
  color: #718096;
  font-style: italic;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f7fafc;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #4a5568;
  min-width: 120px;
  margin-right: 16px;
}

.info-value {
  color: #2d3748;
  flex: 1;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 500;
  color: #4a5568;
  font-size: 0.875rem;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-input:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
}

.form-help {
  font-size: 0.75rem;
  color: #718096;
  margin-top: 4px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  align-self: flex-start;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background-color: #4299e1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #3182ce;
  transform: translateY(-1px);
}

.error-message {
  color: #e53e3e;
  background-color: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 6px;
  padding: 12px;
  font-size: 0.875rem;
}

.success-message {
  color: #38a169;
  background-color: #f0fff4;
  border: 1px solid #9ae6b4;
  border-radius: 6px;
  padding: 12px;
  font-size: 0.875rem;
}
</style>
