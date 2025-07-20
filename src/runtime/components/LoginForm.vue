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
      padding: 2em;
  background: var(--color-bg-primary);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-border);
}

:deep(.formkit-form) {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.login-header {
  text-align: center;
      margin-bottom: 1em;
}

.login-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-gray-800);
      margin: 0 0 0.5em 0;
  line-height: 1.2;
}

.login-subtitle {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin: 0;
  line-height: 1.5;
}

:deep(.formkit-inner) {
  --fk-border-radius: 8px;
  --fk-border-color: var(--color-border-light);
  --fk-border-color-focus: var(--color-primary);
  --fk-bg-color: var(--color-bg-secondary);
  --fk-bg-color-focus: var(--color-bg-primary);
  --fk-text-color: var(--color-gray-700);
  --fk-text-color-placeholder: var(--color-gray-400);
  --fk-font-size: 0.875rem;
      --fk-padding: 0.75em 1em;
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
  color: var(--color-gray-700);
      margin-bottom: 0.5em;
}

:deep(.formkit-messages) {
  list-style: none;
  font-size: 0.75rem;
  padding: 0;
}
:deep(.formkit-message) {
      margin-top: 0.25em;
}

:deep(.formkit-message[data-message-type="validation"]) {
  color: var(--color-error-alt);
}
:deep(.formkit-message[data-message-type="error"]) {
  color: var(--color-error);
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
  color: var(--color-gray-700);
}

:deep(button[type='submit']) {
  width: 100%;
  padding: 0.75em 1em;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-white);
  background-color: var(--color-primary);
  border: 1px solid var(--color-primary);
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
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

:deep(button[type='submit']:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-white);
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
  margin-top: 1em;
}

.forgot-password {
  margin: 0;
}

.forgot-link {
  font-size: 0.875rem;
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.2s ease-in-out;
}

.forgot-link:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.error-message {
  padding: 0.75em 1em;
  background-color: var(--color-error-light);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 0.875rem;
  text-align: center;
  margin-top: 1em;
}

/* Responsive design */
@media (max-width: 480px) {
  .login-form-container {
    padding: 1.5em;
    margin: 1em;
  }

  .login-title {
    font-size: 1.5rem;
  }
}
</style>
