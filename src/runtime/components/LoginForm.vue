<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from '#app'
import type { LoginFormData, LoginFormProps, User } from '../../types'

interface Emits {
  (e: 'success', user: User): void
  (e: 'error', error: string): void
  (e: 'submit', data: LoginFormData): void
}

const props = withDefaults(defineProps<LoginFormProps>(), {
  apiEndpoint: '/api/login',
  redirectTo: '/'
})

const emit = defineEmits<Emits>()

const isLoading = ref(false)
const error = ref('')

const handleSubmit = async (formData: LoginFormData) => {
  isLoading.value = true
  error.value = ''

  try {
    emit('submit', formData)

    const response = await $fetch<{ user: User }>(props.apiEndpoint, {
      method: 'POST',
      body: {
        email: formData.email,
        password: formData.password
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
</script>

<template>
  <div class="login-form-container">
    <FormKit
      type="form"
      :actions="false"
      @submit="handleSubmit"
    >
      <!-- Header slot -->
      <slot name="header">
        <div class="login-header">
          <h2 class="login-title">
            Welcome Back
          </h2>
          <p class="login-subtitle">
            Sign in to your account
          </p>
        </div>
      </slot>

      <!-- Email field -->
      <slot name="email-field">
        <FormKit
          type="email"
          name="email"
          label="Email"
          placeholder="Enter your email"
          validation="required|email"
        />
      </slot>

      <!-- Password field -->
      <slot name="password-field">
        <FormKit
          type="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          validation="required|length:6"
        />
      </slot>

      <!-- Remember me slot -->
      <slot name="remember-me">
        <div class="remember-me">
          <FormKit
            type="checkbox"
            name="rememberMe"
            label="Remember me"
          />
        </div>
      </slot>

      <!-- Submit button slot -->
      <slot name="submit-button">
        <FormKit
          type="submit"
          :disabled="isLoading"
        >
          <span
            v-if="isLoading"
            class="loading-spinner"
          />
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </FormKit>
      </slot>

      <!-- Footer slot -->
      <slot name="footer">
        <div class="login-footer">
          <p class="forgot-password">
            <a
              href="#"
              class="forgot-link"
            >Forgot your password?</a>
          </p>
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
    </FormKit>
  </div>
</template>

<style scoped>
.login-form-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

:deep(.formkit-form) {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.login-header {
  text-align: center;
  margin-bottom: 1rem;
}

.login-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.login-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

:deep(.formkit-inner) {
  --fk-border-radius: 8px;
  --fk-border-color: #d1d5db;
  --fk-border-color-focus: #3b82f6;
  --fk-bg-color: #f9fafb;
  --fk-bg-color-focus: #ffffff;
  --fk-text-color: #374151;
  --fk-text-color-placeholder: #9ca3af;
  --fk-font-size: 0.875rem;
  --fk-padding: 0.75rem 1rem;
  --fk-transition: all 0.2s ease-in-out;
}

:deep(.formkit-inner .formkit-input) {
  width: 100%;
  padding: var(--fk-padding);
  font-size: var(--fk-font-size);
  border: 1px solid var(--fk-border-color);
  border-radius: var(--fk-border-radius);
  background-color: var(--fk-bg-color);
  color: var(--fk-text-color);
  transition: var(--fk-transition);
  box-sizing: border-box;
}

:deep(.formkit-inner .formkit-input:focus) {
  outline: none;
  border-color: var(--fk-border-color-focus);
  background-color: var(--fk-bg-color-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.formkit-inner .formkit-label) {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

:deep(.formkit-messages) {
  list-style: none;
  font-size: 0.75rem;
  padding: 0;
}
:deep(.formkit-message) {
  margin-top: 0.25rem;
}

:deep(.formkit-message[data-message-type="validation"]) {
  color: #db5050;
}
:deep(.formkit-message[data-message-type="error"]) {
  color: #dc2626;
}

:deep(.formkit-wrapper:has(input[type="checkbox"])) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

:deep(.formkit-input[type="checkbox"]) {
  width: auto;
  margin: 0;
}

:deep(.formkit-label:has(input[type="checkbox"])) {
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
}

:deep(button[type='submit']) {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
  background-color: #3b82f6;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
}

:deep(button[type='submit']:hover:not(:disabled)) {
  background-color: #2563eb;
  border-color: #2563eb;
}

:deep(button[type='submit']:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-footer {
  text-align: center;
  margin-top: 1rem;
}

.forgot-password {
  margin: 0;
}

.forgot-link {
  font-size: 0.875rem;
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s ease-in-out;
}

.forgot-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.error-message {
  padding: 0.75rem 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 1rem;
}

/* Responsive design */
@media (max-width: 480px) {
  .login-form-container {
    padding: 1.5rem;
    margin: 1rem;
  }

  .login-title {
    font-size: 1.5rem;
  }
}
</style>
