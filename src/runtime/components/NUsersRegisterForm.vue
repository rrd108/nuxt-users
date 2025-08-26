<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { navigateTo } from '#app'
import type { UserWithoutPassword, ModuleOptions, PasswordValidationResult } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { validatePassword } from 'nuxt-users/utils'

const { public: { nuxtUsers } } = useRuntimeConfig()
const { passwordValidation } = nuxtUsers as ModuleOptions

// Props interface
interface Props {
  apiEndpoint?: string
  redirectTo?: string
  loginLink?: string
}

interface Emits {
  (e: 'success', data: { user: Omit<UserWithoutPassword, 'active'>, message: string }): void
  (e: 'error', error: string): void
  (e: 'submit', data: RegistrationFormData): void
}

interface RegistrationFormData {
  email: string
  name: string
  password: string
  confirmPassword: string
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

// Compute default endpoints if not provided
const apiEndpoint = computed(() => props.apiEndpoint || `${(nuxtUsers as { apiBasePath?: string })?.apiBasePath}/register`)

const isLoading = ref(false)
const error = ref('')
const successMessage = ref('')
const passwordValidationResult = ref<PasswordValidationResult | null>(null)

const formData = ref<RegistrationFormData>({
  email: '',
  name: '',
  password: '',
  confirmPassword: ''
})

// Watch password changes for validation
watch(() => formData.value.password, (newPassword) => {
  if (newPassword) {
    passwordValidationResult.value = validatePassword(newPassword, passwordValidation)
  }
  else {
    passwordValidationResult.value = null
  }
}, { immediate: true })

// Computed properties for validation
const passwordsMatch = computed(() => {
  return formData.value.password === formData.value.confirmPassword || !formData.value.confirmPassword
})

const isFormValid = computed(() => {
  return formData.value.email
    && formData.value.name
    && formData.value.password
    && formData.value.confirmPassword
    && passwordsMatch.value
    && (passwordValidationResult.value?.isValid ?? false)
})

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill all fields correctly'
    return
  }

  isLoading.value = true
  error.value = ''
  successMessage.value = ''

  try {
    emit('submit', formData.value)

    const response = await $fetch<{ user: Omit<UserWithoutPassword, 'active'>, message: string }>(apiEndpoint.value, {
      method: 'POST',
      body: {
        email: formData.value.email,
        name: formData.value.name,
        password: formData.value.password
      }
    })

    successMessage.value = response.message
    emit('success', response)

    // Reset form after successful registration
    formData.value = {
      email: '',
      name: '',
      password: '',
      confirmPassword: ''
    }

    // Redirect if specified
    if (props.redirectTo) {
      setTimeout(() => {
        navigateTo(props.redirectTo!)
      }, 3000) // Give user time to read success message
    }
  }
  catch (err: unknown) {
    const errorMessage = err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'statusMessage' in err.data
      ? String(err.data.statusMessage)
      : err instanceof Error
        ? err.message
        : 'Registration failed'
    error.value = errorMessage
    emit('error', errorMessage)
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="n-users-register-section n-users-section">
    <form @submit.prevent="handleSubmit">
      <!-- Header slot -->
      <slot name="header">
        <div class="n-users-register-header">
          <h2 class="n-users-register-title">
            Create Account
          </h2>
          <p class="n-users-register-subtitle">
            Sign up for a new account
          </p>
        </div>
      </slot>

      <!-- Name field -->
      <slot name="name-field">
        <div class="n-users-form-group">
          <label for="name">Full Name</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            name="name"
            placeholder="Enter your full name"
            required
          >
        </div>
      </slot>

      <!-- Email field -->
      <slot name="email-field">
        <div class="n-users-form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            name="email"
            placeholder="Enter your email"
            required
          >
        </div>
      </slot>

      <!-- Password field -->
      <slot name="password-field">
        <div class="n-users-form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            name="password"
            placeholder="Enter your password"
            required
            :minlength="passwordValidation.minLength"
          >
        </div>
      </slot>

      <!-- Password strength indicator -->
      <slot name="password-strength">
        <NUsersPasswordStrengthIndicator
          v-if="formData.password"
          :password="formData.password"
          :validation-result="passwordValidationResult"
          :show-hints="true"
          :show-rules="true"
        />
      </slot>

      <!-- Confirm Password field -->
      <slot name="confirm-password-field">
        <div class="n-users-form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            required
            :class="{ 'n-users-input-error': !passwordsMatch }"
          >
          <small
            v-if="!passwordsMatch && formData.confirmPassword"
            class="n-users-error-text"
          >
            Passwords do not match
          </small>
        </div>
      </slot>

      <!-- Submit button slot -->
      <slot name="submit-button">
        <button
          type="submit"
          :disabled="isLoading || !isFormValid"
        >
          <span
            v-if="isLoading"
            class="n-users-loading-spinner"
          />
          {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </slot>

      <!-- Footer slot -->
      <slot name="footer">
        <div class="n-users-register-footer">
          <p class="n-users-login-link">
            Already have an account?
            <a
              :href="loginLink || '/login'"
              class="n-users-link"
            >
              Sign in here
            </a>
          </p>
        </div>
      </slot>

      <!-- Success message slot -->
      <slot
        name="success-message"
        :message="successMessage"
      >
        <div
          v-if="successMessage"
          class="n-users-success-message"
        >
          {{ successMessage }}
        </div>
      </slot>

      <!-- Error message slot -->
      <slot
        name="error-message"
        :error="error"
      >
        <div
          v-if="error"
          class="n-users-error-message"
        >
          {{ error }}
        </div>
      </slot>
    </form>
  </section>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
