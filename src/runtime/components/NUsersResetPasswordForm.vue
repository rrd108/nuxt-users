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
  <div class="n-users-section">
    <h2 class="n-users-section-header">
      Change Password
    </h2>

    <form @submit.prevent="updatePassword">
      <div class="n-users-form-group">
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
        >New Password</label>
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
        >Confirm New Password</label>
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
        <span v-if="isPasswordLoading">Updating...</span>
        <span v-else>Update Password</span>
      </button>
    </form>
  </div>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
