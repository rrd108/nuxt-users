<script setup lang="ts">
import { ref, computed } from 'vue'
import { navigateTo } from '#app'
import type { LoginFormData, LoginFormProps, UserWithoutPassword, ModuleOptions } from "nuxt-users/utils"
import { useRuntimeConfig } from '#imports'

const { public: { nuxtUsers } } = useRuntimeConfig()
const { passwordValidation } = nuxtUsers as ModuleOptions

interface Emits {
  (e: 'success', user: UserWithoutPassword): void
  (e: 'error' | 'forgot-password-error', error: string): void
  (e: 'submit', data: LoginFormData): void
  (e: 'forgot-password-success'): void
}

const props = defineProps<LoginFormProps>()

const emit = defineEmits<Emits>()

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
        password: formData.value.password
      }
    })

    emit('success', response.user)

    // Redirect if specified
    if (props.redirectTo) {
      await navigateTo(props.redirectTo)
    }
  }
  catch (err: unknown) {
    const errorMessage = err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'statusMessage' in err.data
      ? String(err.data.statusMessage)
      : err instanceof Error
        ? err.message
        : 'Login failed'
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
    const errorMessage = err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'statusMessage' in err.data
      ? String(err.data.statusMessage)
      : err instanceof Error
        ? err.message
        : 'Failed to send password reset email'
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
            Welcome Back
          </h2>
          <p class="n-users-login-subtitle">
            Sign in to your account
          </p>
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

      <!-- Remember me slot -->
      <slot name="remember-me">
        <div class="n-users-remember-me">
          <input
            id="rememberMe"
            v-model="formData.rememberMe"
            type="checkbox"
            name="rememberMe"
          >
          <label for="rememberMe">Remember me</label>
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
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
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
              {{ isForgotPasswordLoading ? 'Sending...' : 'Forgot your password?' }}
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
          class="success-message"
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
          class="error-message"
        >
          {{ error }}
        </div>
      </slot>
    </form>
  </section>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
