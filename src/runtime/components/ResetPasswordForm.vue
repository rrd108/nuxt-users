<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from '#app' // Nuxt 3 specific imports
import { usePasswordValidation } from '../composables/usePasswordValidation'
import { useRuntimeConfig } from '#imports'
import type { ModuleOptions } from '../../types'
import PasswordStrengthIndicator from './PasswordStrengthIndicator.vue'

interface ResetPasswordFormData {
  password: string
  password_confirm: string
}

const formData = reactive<ResetPasswordFormData>({
  password: '',
  password_confirm: '',
})

const message = ref('')
const loading = ref(false)
const isError = ref(false)
const formInvalidDueToToken = ref(false)

const route = useRoute()
const router = useRouter()

const tokenFromUrl = ref<string | null>(null)
const emailFromUrl = ref<string | null>(null)

onMounted(() => {
  if (typeof route.query.token === 'string') {
    tokenFromUrl.value = route.query.token
  }
  if (typeof route.query.email === 'string') {
    emailFromUrl.value = decodeURIComponent(route.query.email)
  }

  if (!tokenFromUrl.value || !emailFromUrl.value) {
    message.value = 'Invalid or missing password reset token or email in URL. Cannot reset password.'
    isError.value = true
    formInvalidDueToToken.value = true
  }
})

const canSubmit = computed(() => !!tokenFromUrl.value && !!emailFromUrl.value && !formInvalidDueToToken.value)

// Get module options for password validation
const { public: { nuxtUsers } } = useRuntimeConfig()
const moduleOptions = nuxtUsers as ModuleOptions

const passwordValidation = usePasswordValidation(moduleOptions)

watch(() => formData.password, (newPassword) => {
  if (newPassword) {
    passwordValidation.validate(newPassword)
  }
  else {
    passwordValidation.clearValidation()
  }
})

const handleResetPassword = async () => {
  if (!canSubmit.value) {
    message.value = 'Token or email is missing or invalid. Cannot reset password.'
    isError.value = true
    return
  }

  if (formData.password !== formData.password_confirm) {
    message.value = 'Passwords do not match.'
    isError.value = true
    return
  }

  loading.value = true
  message.value = ''
  isError.value = false

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        token: tokenFromUrl.value,
        email: emailFromUrl.value,
        password: formData.password,
        password_confirmation: formData.password_confirm,
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.message || responseData.statusMessage || 'An error occurred.')
    }

    message.value = responseData.message + ' Redirecting to login...'
    isError.value = false
    formData.password = ''
    formData.password_confirm = ''

    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
  catch (err: unknown) {
    if (err instanceof Error) {
      message.value = err.message
    }
    else {
      message.value = 'Failed to reset password.'
    }
    console.error('[Nuxt Users] Reset Password Form Error:', err)
    isError.value = true
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2>Reset Password</h2>
    <form @submit.prevent="handleResetPassword">
      <div class="form-group">
        <label for="password">New Password</label>
        <input
          id="password"
          v-model="formData.password"
          type="password"
          name="password"
          placeholder="Enter new password"
          required
          :minlength="moduleOptions.passwordValidation?.minLength || 8"
          :class="{ error: passwordValidation.errors.value.length > 0 && formData.password }"
        >
        <PasswordStrengthIndicator
          :password="formData.password"
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
        <label for="password_confirm">Confirm New Password</label>
        <input
          id="password_confirm"
          v-model="formData.password_confirm"
          type="password"
          name="password_confirm"
          placeholder="Confirm new password"
          required
          :minlength="moduleOptions.passwordValidation?.minLength || 8"
        >
      </div>
      <button
        type="submit"
        :disabled="loading || formInvalidDueToToken"
      >
        {{ loading ? 'Resetting...' : 'Reset Password' }}
      </button>
      <p
        v-if="message"
        :class="{ error: isError, success: !isError }"
        class="form-message"
      >
        {{ message }}
      </p>
    </form>
  </div>
</template>

<style scoped>
.error {
  color: red;
}
.success {
  color: green;
}
.form-message {
  margin-top: 1em;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1em;
}

label {
  display: block;
  margin-bottom: 0.25em;
  font-weight: bold;
}

input[type="password"] {
  width: 100%;
  padding: 0.75em;
  box-sizing: border-box;
  border: 1px solid var(--color-border-dark);
  border-radius: 4px;
}

input[type="password"].error {
  border-color: #dc3545;
}

.form-help {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 4px;
  display: block;
}

button[type="submit"] {
  padding: 0.75em 1.5em;
  cursor: pointer;
  background-color: var(--color-gray-800);
  color: white;
  border: none;
  border-radius: 4px;
}

button[type="submit"]:disabled {
  background-color: var(--color-gray-500);
  cursor: not-allowed;
}
</style>
