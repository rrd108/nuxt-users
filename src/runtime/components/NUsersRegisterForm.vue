<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { navigateTo } from '#app'
import type { UserWithoutPassword, ModuleOptions, PasswordValidationResult } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { validatePassword } from 'nuxt-users/utils'
import { useNuxtUsersLocale } from '../composables/useNuxtUsersLocale'

const { public: { nuxtUsers } } = useRuntimeConfig()
const { passwordValidation } = nuxtUsers as ModuleOptions
const { t } = useNuxtUsersLocale()

// Props interface
interface Props {
  apiEndpoint?: string
  redirectTo?: string
  loginLink?: string
  // Optional label overrides
  title?: string
  subtitle?: string
  nameLabel?: string
  namePlaceholder?: string
  emailLabel?: string
  emailPlaceholder?: string
  passwordLabel?: string
  passwordPlaceholder?: string
  confirmPasswordLabel?: string
  confirmPasswordPlaceholder?: string
  passwordMismatchError?: string
  submitLabel?: string
  submittingLabel?: string
  alreadyHaveAccountText?: string
  signInLinkText?: string
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
  if (!newPassword) {
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
            {{ props.title || t('register.title') }}
          </h2>
          <p class="n-users-register-subtitle">
            {{ props.subtitle || t('register.subtitle') }}
          </p>
        </div>
      </slot>

      <!-- Name field -->
      <slot name="name-field">
        <div class="n-users-form-group">
          <label for="name">{{ props.nameLabel || t('register.nameLabel') }}</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            name="name"
            :placeholder="props.namePlaceholder || t('register.namePlaceholder')"
            required
          >
        </div>
      </slot>

      <!-- Email field -->
      <slot name="email-field">
        <div class="n-users-form-group">
          <label for="email">{{ props.emailLabel || t('register.emailLabel') }}</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            name="email"
            :placeholder="props.emailPlaceholder || t('register.emailPlaceholder')"
            required
          >
        </div>
      </slot>

      <!-- Password field -->
      <slot name="password-field">
        <div class="n-users-form-group">
          <label for="password">{{ props.passwordLabel || t('register.passwordLabel') }}</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            name="password"
            :placeholder="props.passwordPlaceholder || t('register.passwordPlaceholder')"
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
          <label for="confirmPassword">{{ props.confirmPasswordLabel || t('register.confirmPasswordLabel') }}</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            name="confirmPassword"
            :placeholder="props.confirmPasswordPlaceholder || t('register.confirmPasswordPlaceholder')"
            required
            :class="{ 'n-users-input-error': !passwordsMatch }"
          >
          <small
            v-if="!passwordsMatch && formData.confirmPassword"
            class="n-users-error-text"
          >
            {{ props.passwordMismatchError || t('register.passwordMismatch') }}
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
          {{ isLoading ? (props.submittingLabel || t('register.submitting')) : (props.submitLabel || t('register.submit')) }}
        </button>
      </slot>

      <!-- Footer slot -->
      <slot name="footer">
        <div class="n-users-register-footer">
          <p class="n-users-login-link">
            {{ props.alreadyHaveAccountText || t('register.alreadyHaveAccount') }}
            <a
              :href="loginLink || '/login'"
              class="n-users-link"
            >
              {{ props.signInLinkText || t('register.signInLink') }}
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
