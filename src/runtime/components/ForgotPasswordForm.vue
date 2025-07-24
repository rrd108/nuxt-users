<script setup lang="ts">
import { ref, reactive } from 'vue'

interface ForgotPasswordFormData {
  email: string
}

const formData = reactive<ForgotPasswordFormData>({
  email: '',
})

const message = ref('')
const loading = ref(false)
const isError = ref(false)

const handleForgotPassword = async () => {
  loading.value = true
  message.value = ''
  isError.value = false

  try {
    const response = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email: formData.email }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.message || responseData.statusMessage || 'An error occurred.')
    }

    message.value = responseData.message
    isError.value = false
    formData.email = '' // Clear email field on success
  }
  catch (err: unknown) {
    if (err instanceof Error) {
      message.value = err.message
    }
    else {
      message.value = 'Failed to send password reset link.'
    }
    console.error(err)
    isError.value = true
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2>Forgot Password</h2>
    <form @submit.prevent="handleForgotPassword">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          name="email"
          placeholder="your@email.com"
          required
        >
      </div>
      <button
        type="submit"
        :disabled="loading"
      >
        {{ loading ? 'Sending...' : 'Send Password Reset Link' }}
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

input[type="email"] {
  width: 100%;
  padding: 0.75em;
  box-sizing: border-box;
  border: 1px solid var(--color-border-dark);
  border-radius: 4px;
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
