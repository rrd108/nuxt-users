<script setup lang="ts">
import { ref, computed } from 'vue'
import { navigateTo } from '#app'
import type { LoginFormData, UserWithoutPassword, ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { useNuxtUsersLocale } from '../composables/useNuxtUsersLocale'

const { public: { nuxtUsers } } = useRuntimeConfig()
const { passwordValidation } = nuxtUsers as ModuleOptions
const { t } = useNuxtUsersLocale()

// Note: We define Props interface inline instead of importing LoginFormProps from 'nuxt-users/utils'
// because the Vue SFC transformer cannot resolve these imported types during the module build process
interface Props {
  apiEndpoint?: string
  forgotPasswordEndpoint?: string
  redirectTo?: string
  // Optional label overrides
  title?: string
  subtitle?: string
  emailLabel?: string
  emailPlaceholder?: string
  passwordLabel?: string
  passwordPlaceholder?: string
  rememberMeLabel?: string
  submitLabel?: string
  submittingLabel?: string
  forgotPasswordLabel?: string
  forgotPasswordSendingLabel?: string
}

interface Emits {
  (e: 'success', user: UserWithoutPassword, rememberMe: boolean): void
  (e: 'error' | 'forgot-password-error', error: string): void
  (e: 'submit', data: LoginFormData): void
  (e: 'forgot-password-success'): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const extractErrorMessage = (err: unknown, defaultMessage: string): string => {
  if (err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'statusMessage' in err.data) {
    return String(err.data.statusMessage)
  }
  if (err instanceof Error) {
    return err.message
  }
  return defaultMessage
}

// Compute default endpoints if not provided
const apiEndpoint = computed(() => props.apiEndpoint || `${(nuxtUsers as { apiBasePath?: string })?.apiBasePath}/session`)
const forgotPasswordEndpoint = computed(() => props.forgotPasswordEndpoint || `${(nuxtUsers as { apiBasePath?: string })?.apiBasePath}/password/forgot`)

const isLoading = ref(false)
const isForgotPasswordLoading = ref(false)
const error = ref('')
const forgotPasswordMessage = ref('')
const formData = ref<LoginFormData>({
  email: '',
  password: '',
  rememberMe: false
})

const handleSubmit = async () => {
  isLoading.value = true
  error.value = ''

  try {
    emit('submit', formData.value)

    const response = await $fetch<{ user: UserWithoutPassword }>(apiEndpoint.value, {
      method: 'POST',
      body: {
        email: formData.value.email,
        password: formData.value.password,
        rememberMe: formData.value.rememberMe
      }
    })

    emit('success', response.user, formData.value.rememberMe ?? false)

    // Redirect if specified
    if (props.redirectTo) {
      await navigateTo(props.redirectTo)
    }
  }
  catch (err: unknown) {
    const errorMessage = extractErrorMessage(err, 'Login failed')
    error.value = errorMessage
    emit('error', errorMessage)
  }
  finally {
    isLoading.value = false
  }
}

const handleForgotPassword = async () => {
  if (!formData.value.email) {
    error.value = 'Please enter your email address first'
    return
  }

  isForgotPasswordLoading.value = true
  forgotPasswordMessage.value = ''
  error.value = ''

  try {
    const response = await $fetch<{ message: string }>(forgotPasswordEndpoint.value, {
      method: 'POST',
      body: {
        email: formData.value.email
      }
    })

    forgotPasswordMessage.value = response.message
    emit('forgot-password-success')
  }
  catch (err: unknown) {
    const errorMessage = extractErrorMessage(err, 'Failed to send password reset email')
    error.value = errorMessage
    emit('forgot-password-error', errorMessage)
  }
  finally {
    isForgotPasswordLoading.value = false
  }
}
</script>

<template>
  <section class="n-users-login-section n-users-section">
    <form @submit.prevent="handleSubmit">
      <!-- Header slot -->
      <slot name="header">
        <div class="n-users-login-header">
          <h2 class="n-users-login-title">
            {{ props.title || t('login.title') }}
          </h2>
          <p class="n-users-login-subtitle">
            {{ props.subtitle || t('login.subtitle') }}
          </p>
        </div>
      </slot>

      <!-- Email field -->
      <slot name="email-field">
        <div class="n-users-form-group">
          <label for="email">{{ props.emailLabel || t('login.emailLabel') }}</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            name="email"
            :placeholder="props.emailPlaceholder || t('login.emailPlaceholder')"
            required
          >
        </div>
      </slot>

      <!-- Password field -->
      <slot name="password-field">
        <div class="n-users-form-group">
          <label for="password">{{ props.passwordLabel || t('login.passwordLabel') }}</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            name="password"
            :placeholder="props.passwordPlaceholder || t('login.passwordPlaceholder')"
            required
            :minlength="passwordValidation.minLength"
          >
        </div>
      </slot>

      <!-- Remember me slot -->
      <slot name="remember-me">
        <div class="n-users-remember-me">
          <input
            id="rememberMe"
            v-model="formData.rememberMe"
            type="checkbox"
            name="rememberMe"
          >
          <label for="rememberMe">{{ props.rememberMeLabel || t('login.rememberMe') }}</label>
        </div>
      </slot>

      <!-- Submit button slot -->
      <slot name="submit-button">
        <button
          type="submit"
          :disabled="isLoading"
        >
          <span
            v-if="isLoading"
            class="n-users-loading-spinner"
          />
          {{ isLoading ? (props.submittingLabel || t('login.submitting')) : (props.submitLabel || t('login.submit')) }}
        </button>
      </slot>

      <!-- Footer slot -->
      <slot name="footer">
        <div class="n-users-login-footer">
          <p class="n-users-forgot-password">
            <a
              href="#"
              class="n-users-forgot-link"
              :class="{ loading: isForgotPasswordLoading }"
              @click.prevent="handleForgotPassword"
            >
              <span
                v-if="isForgotPasswordLoading"
                class="n-users-loading-spinner"
              />
              {{ isForgotPasswordLoading ? (props.forgotPasswordSendingLabel || t('login.forgotPasswordSending')) : (props.forgotPasswordLabel || t('login.forgotPassword')) }}
            </a>
          </p>
        </div>
      </slot>

      <!-- Success message slot -->
      <slot
        name="success-message"
        :message="forgotPasswordMessage"
      >
        <div
          v-if="forgotPasswordMessage"
          class="n-users-success-message"
        >
          {{ forgotPasswordMessage }}
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
