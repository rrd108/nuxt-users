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

    const response = await $fetch<{ user: User }>(props.apiEndpoint, {
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
</script>

<template>
  <div class="login-form-container">
    <form @submit.prevent="handleSubmit">
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
        <div class="form-group">
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
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            name="password"
            placeholder="Enter your password"
            required
            minlength="6"
          >
        </div>
      </slot>

      <!-- Remember me slot -->
      <slot name="remember-me">
        <div class="remember-me">
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
            class="loading-spinner"
          />
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
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
    </form>
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

form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  margin-bottom: 0.5em;
}

input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 0.75em 1em;
  font-size: 0.875rem;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background-color: var(--color-bg-secondary);
  color: var(--color-gray-700);
  transition: all 0.2s ease-in-out;
  box-sizing: border-box;
}

input[type="email"]:focus,
input[type="password"]:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: var(--color-bg-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.remember-me label {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-gray-700);
}

button[type='submit'] {
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

button[type='submit']:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

button[type='submit']:disabled {
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
