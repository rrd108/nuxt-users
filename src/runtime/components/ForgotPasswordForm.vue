<template>
  <div>
    <h2>Forgot Password</h2>
    <FormKit
      v-slot="{ disabled }"
      type="form"
      :actions="false"
      @submit="handleForgotPassword"
    >
      <FormKit
        v-model="formData.email"
        type="email"
        name="email"
        label="Email"
        placeholder="your@email.com"
        validation="required|email"
      />
      <FormKit
        type="submit"
        :label="loading ? 'Sending...' : 'Send Password Reset Link'"
        :disabled="disabled || loading"
      />
      <p
        v-if="message"
        :class="{ error: isError, success: !isError }"
        class="form-message"
      >
        {{ message }}
      </p>
    </FormKit>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
// Ensure FormKit types are available if you're using them explicitly,
// though often not needed for basic setup with Nuxt FormKit module.

interface ForgotPasswordFormData {
  email: string
}

const formData = reactive<ForgotPasswordFormData>({
  email: '',
})

const message = ref('')
const loading = ref(false)
const isError = ref(false)

const handleForgotPassword = async (data: ForgotPasswordFormData) => {
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
      body: JSON.stringify({ email: data.email }), // Use email from form data
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

<style scoped>
.error {
  color: red;
}
.success {
  color: green;
}
.form-message {
  margin-top: 1rem;
  font-size: 0.9rem;
}
/* Basic styling for FormKit elements if not using a global theme */
:deep(.formkit-outer) {
  margin-bottom: 1rem;
}
:deep(.formkit-label) {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: bold;
}
:deep(.formkit-input input[type="email"]),
:deep(.formkit-input input[type="password"]) {
  width: 100%;
  padding: 0.75rem;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
}
:deep(.formkit-input input[type="submit"]) {
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
}
:deep(.formkit-input input[type="submit"]:disabled) {
  background-color: #aaa;
  cursor: not-allowed;
}
:deep(.formkit-messages) {
  list-style: none;
  padding: 0;
  margin-top: 0.25rem;
}
:deep(.formkit-message) {
  color: red;
  font-size: 0.8rem;
}
</style>
