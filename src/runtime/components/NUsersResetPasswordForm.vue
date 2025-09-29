<script setup lang="ts">
/**
 * NUsersResetPasswordForm Component
 *
 * A dual-purpose password form component that handles both:
 * 1. Password reset from email links (when token and email are in URL query params)
 * 2. Password change for logged-in users (when no token/email in URL)
 *
 * The component automatically detects which mode to use based on URL parameters.
 * For password reset: requires token and email in URL query params
 * For password change: requires user to be logged in and provide current password
 */
import { ref, watch, computed } from 'vue'
import type { UserWithoutPassword, ModuleOptions } from 'nuxt-users/utils'
import { usePasswordValidation } from '../composables/usePasswordValidation'
import { useRuntimeConfig, useRoute, useRouter } from '#imports'
import NUsersPasswordStrengthIndicator from './NUsersPasswordStrengthIndicator.vue'

// Note: We define Props interface inline instead of importing ResetPasswordFormProps from 'nuxt-users/utils'
// because the Vue SFC transformer cannot resolve these imported types during the module build process
interface Props {
  updatePasswordEndpoint?: string
  resetPasswordEndpoint?: string
  redirectTo?: string
}

interface Emits {
  (e: 'success', user: UserWithoutPassword): void
  (e: 'error' | 'password-error', error: string): void
  (e: 'password-updated'): void
}

const { public: { nuxtUsers } } = useRuntimeConfig()
const moduleOptions = nuxtUsers as ModuleOptions

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const route = useRoute()
const router = useRouter()

const isPasswordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

// Check if this is a password reset from email link
const isPasswordReset = computed(() => {
  return route.query.token && route.query.email
})

// Get token and email from URL for password reset
const resetToken = computed(() => route.query.token as string)
const resetEmail = computed(() => route.query.email as string)

// Password form data
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: ''
})

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

// Update password (for logged-in users)
const updatePassword = async () => {
  isPasswordLoading.value = true
  passwordError.value = ''
  passwordSuccess.value = ''

  try {
    await $fetch(props.updatePasswordEndpoint || nuxtUsers.apiBasePath + '/password', {
      method: 'PATCH',
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

// Reset password (for email reset links)
const resetPassword = async () => {
  if (!resetToken.value || !resetEmail.value) {
    passwordError.value = 'Missing reset token or email. Please use the link from your email.'
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.newPasswordConfirmation) {
    passwordError.value = 'Passwords do not match'
    return
  }

  isPasswordLoading.value = true
  passwordError.value = ''
  passwordSuccess.value = ''

  try {
    await $fetch(props.resetPasswordEndpoint || nuxtUsers.apiBasePath + '/password/reset', {
      method: 'POST',
      body: {
        token: resetToken.value,
        email: resetEmail.value,
        password: passwordForm.value.newPassword,
        password_confirmation: passwordForm.value.newPasswordConfirmation
      }
    })

    passwordSuccess.value = 'Password reset successfully. You can now log in with your new password.'
    emit('password-updated')

    // Clear form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirmation: ''
    }

    // Redirect to login page after a short delay
    setTimeout(() => {
      router.push(props.redirectTo || '/login')
    }, 2000)
  }
  catch (err: unknown) {
    const errorMessage = err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'statusMessage' in err.data
      ? String(err.data.statusMessage)
      : err instanceof Error
        ? err.message
        : 'Failed to reset password'
    passwordError.value = errorMessage
    emit('password-error', errorMessage)
  }
  finally {
    isPasswordLoading.value = false
  }
}

// Handle form submission based on mode
const handleSubmit = () => {
  if (isPasswordReset.value) {
    resetPassword()
  }
  else {
    updatePassword()
  }
}
</script>

<template>
  <div class="n-users-reset-password-container n-users-section">
    <h2 class="n-users-section-header">
      {{ isPasswordReset ? 'Reset Password' : 'Change Password' }}
    </h2>

    <div
      v-if="isPasswordReset"
      class="n-users-info-message"
    >
      <p>You are resetting your password using a secure link.</p>
      <p><strong>Email:</strong> {{ resetEmail }}</p>
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- Current Password field - only show for logged-in users -->
      <div
        v-if="!isPasswordReset"
        class="n-users-form-group"
      >
        <label
          for="currentPassword"
          class="n-users-form-label"
        >Current Password</label>
        <input
          id="currentPassword"
          v-model="passwordForm.currentPassword"
          type="password"
          class="n-users-form-input"
          required
          :disabled="isPasswordLoading"
        >
      </div>

      <div class="n-users-form-group">
        <label
          for="newPassword"
          class="n-users-form-label"
        >{{ isPasswordReset ? 'New Password' : 'New Password' }}</label>
        <input
          id="newPassword"
          v-model="passwordForm.newPassword"
          type="password"
          class="n-users-form-input"
          required
          :minlength="moduleOptions.passwordValidation?.minLength || 8"
          :class="{ error: passwordValidation.errors.value.length > 0 && passwordForm.newPassword }"
          :disabled="isPasswordLoading"
        >

        <NUsersPasswordStrengthIndicator
          :password="passwordForm.newPassword"
          :validation-result="passwordValidation.validationResult.value"
        />

        <small class="n-users-form-help">
          Password must contain at least {{ moduleOptions.passwordValidation?.minLength || 8 }} characters
          <span v-if="moduleOptions.passwordValidation?.requireUppercase">, including uppercase letters</span>
          <span v-if="moduleOptions.passwordValidation?.requireLowercase">, lowercase letters</span>
          <span v-if="moduleOptions.passwordValidation?.requireNumbers">, numbers</span>
          <span v-if="moduleOptions.passwordValidation?.requireSpecialChars">, and special characters</span>.
        </small>
      </div>

      <div class="n-users-form-group">
        <label
          for="newPasswordConfirmation"
          class="n-users-form-label"
        >Confirm {{ isPasswordReset ? 'New Password' : 'New Password' }}</label>
        <input
          id="newPasswordConfirmation"
          v-model="passwordForm.newPasswordConfirmation"
          type="password"
          class="n-users-form-input"
          required
          :disabled="isPasswordLoading"
        >
      </div>

      <div
        v-if="passwordError"
        class="n-users-error-message"
      >
        {{ passwordError }}
      </div>

      <div
        v-if="passwordSuccess"
        class="n-users-success-message"
      >
        {{ passwordSuccess }}
      </div>

      <button
        type="submit"
        class="n-users-btn n-users-btn-primary"
        :disabled="isPasswordLoading"
      >
        <span v-if="isPasswordLoading">
          {{ isPasswordReset ? 'Resetting...' : 'Updating...' }}
        </span>
        <span v-else>
          {{ isPasswordReset ? 'Reset Password' : 'Update Password' }}
        </span>
      </button>
    </form>
  </div>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
