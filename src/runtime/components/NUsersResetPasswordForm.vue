<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UserWithoutPassword, ModuleOptions, ResetPasswordFormProps } from '../../types'
import { usePasswordValidation } from '../composables/usePasswordValidation'
import { useRuntimeConfig } from '#imports'
import NUsersPasswordStrengthIndicator from './NUsersPasswordStrengthIndicator.vue'

interface Emits {
  (e: 'success', user: UserWithoutPassword): void
  (e: 'error' | 'password-error', error: string): void
  (e: 'password-updated'): void
}

const { public: { nuxtUsers } } = useRuntimeConfig()
const moduleOptions = nuxtUsers as ModuleOptions

const props = defineProps<ResetPasswordFormProps>()
const emit = defineEmits<Emits>()

const isPasswordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

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

// Update password
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
</script>

<template>
  <div>
    <h2>Change Password</h2>

    <form @submit.prevent="updatePassword">
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

        <NUsersPasswordStrengthIndicator
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
</template>

<style scoped>
div {
  background-color: var(--color-bg-primary);
  max-width: 42em;
  margin: 0 auto;
  padding: 1em;
  border-bottom-left-radius: .5em;
  border-bottom-right-radius: .5em;
}
h2 {
    border-bottom: .1em solid var(--color-border);
}

form {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: .5em;
  width: 90%;
}

.form-label {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.form-input {
  padding: .5em 1em;
  border: 1px solid var(--color-border);
  border-radius: .5em;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 .1em rgba(var(--color-primary-rgb), 0.1);
}

.form-input:disabled {
  background-color: var(--color-bg-secondary);
  cursor: not-allowed;
}

.form-help {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: .25em;
}

.btn {
  padding:.5em 1em;
  border: none;
  border-radius: .5em;
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
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
}

.error-message {
    color: var(--color-error);
  background-color: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: .5em;
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
