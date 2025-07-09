<template>
  <div>
    <h2>Forgot Password</h2>
    <form @submit.prevent="handleForgotPassword">
      <div>
        <label for="email">Email:</label>
        <input id="email" v-model="email" type="email" required />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Sending...' : 'Send Password Reset Link' }}
      </button>
      <p v-if="message" :class="{ error: isError, success: !isError }">{{ message }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
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
      body: JSON.stringify({ email: email.value }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || data.statusMessage || 'An error occurred.')
    }

    message.value = data.message
    isError.value = false
    email.value = '' // Clear email field on success
  }
  catch (err: any) {
    message.value = err.message || 'Failed to send password reset link.'
    isError.value = true
  }
  finally {
    loading.value = false
  }
}
</script>

<style scoped>
.error {
  color: red;
}
.success {
  color: green;
}
form > div {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.25rem;
}
input {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
}
button {
  padding: 0.5rem 1rem;
  cursor: pointer;
}
</style>
