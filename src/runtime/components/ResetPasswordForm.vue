<template>
  <div>
    <h2>Reset Password</h2>
    <form @submit.prevent="handleResetPassword">
      <div>
        <label for="password">New Password:</label>
        <input id="password" v-model="password" type="password" required />
      </div>
      <div>
        <label for="password_confirmation">Confirm New Password:</label>
        <input id="password_confirmation" v-model="passwordConfirmation" type="password" required />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Resetting...' : 'Reset Password' }}
      </button>
      <p v-if="message" :class="{ error: isError, success: !isError }">{{ message }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from '#app' // Nuxt 3 specific imports

const password = ref('')
const passwordConfirmation = ref('')
const message = ref('')
const loading = ref(false)
const isError = ref(false)

const route = useRoute()
const router = useRouter()

const token = ref<string | null>(null)
const email = ref<string | null>(null)

onMounted(() => {
  if (typeof route.query.token === 'string') {
    token.value = route.query.token
  }
  if (typeof route.query.email === 'string') {
    email.value = decodeURIComponent(route.query.email)
  }

  if (!token.value || !email.value) {
    message.value = 'Invalid or missing password reset token or email in URL.'
    isError.value = true
    // Optionally redirect or disable form
  }
})

const handleResetPassword = async () => {
  if (!token.value || !email.value) {
    message.value = 'Token or email is missing. Cannot reset password.'
    isError.value = true
    return
  }
  if (password.value !== passwordConfirmation.value) {
    message.value = 'Passwords do not match.'
    isError.value = true
    return
  }
  if (password.value.length < 8) {
    message.value = 'Password must be at least 8 characters long.'
    isError.value = true
    return;
  }

  loading.value = true
  message.value = ''
  isError.value = false

  try {
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        token: token.value,
        email: email.value,
        password: password.value,
        password_confirmation: passwordConfirmation.value,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || data.statusMessage || 'An error occurred.')
    }

    message.value = data.message + " Redirecting to login..."
    isError.value = false
    // Clear form
    password.value = ''
    passwordConfirmation.value = ''

    // Redirect to login page after a short delay
    setTimeout(() => {
      router.push('/login') // Adjust if your login route is different
    }, 3000)

  }
  catch (err: any) {
    message.value = err.message || 'Failed to reset password.'
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
