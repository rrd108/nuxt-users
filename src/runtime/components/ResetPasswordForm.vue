<template>
  <div>
    <h2>Reset Password</h2>
    <FormKit
      type="form"
      @submit="handleResetPassword"
      :actions="false"
      #default="{ disabled }"
      v-model="formData"
    >
      <FormKit
        type="password"
        name="password"
        label="New Password"
        validation="required|length:8"
        placeholder="Enter new password"
      />
      <FormKit
        type="password"
        name="password_confirm"
        label="Confirm New Password"
        placeholder="Confirm new password"
        validation="required|confirm"
        validation-label="Password confirmation"
      />
      <FormKit
        type="submit"
        :label="loading ? 'Resetting...' : 'Reset Password'"
        :disabled="disabled || loading || formInvalidDueToToken"
      />
      <p v-if="message" :class="{ error: isError, success: !isError }" class="form-message">{{ message }}</p>
    </FormKit>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from '#app' // Nuxt 3 specific imports

interface ResetPasswordFormData {
  password: string
  password_confirm: string // FormKit's confirm rule expects field_confirm
}

const formData = reactive<ResetPasswordFormData>({
  password: '',
  password_confirm: '',
})

const message = ref('')
const loading = ref(false)
const isError = ref(false)
const formInvalidDueToToken = ref(false) // To disable submit if token/email is missing

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
    formInvalidDueToToken.value = true // Disable form submission
  }
})

// Computed property to check if token/email are present
const canSubmit = computed(() => !!tokenFromUrl.value && !!emailFromUrl.value && !formInvalidDueToToken.value)

const handleResetPassword = async (data: ResetPasswordFormData) => {
  if (!canSubmit.value) {
    // This check is mostly redundant if button is disabled, but good for safety
    message.value = 'Token or email is missing or invalid. Cannot reset password.'
    isError.value = true
    return
  }

  // FormKit handles password confirmation validation, so direct check is not strictly needed here
  // but API also validates. Password length is also handled by FormKit.

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
        token: tokenFromUrl.value,
        email: emailFromUrl.value,
        password: data.password, // Use password from form data
        password_confirmation: data.password_confirm, // Use confirmation from form data
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.message || responseData.statusMessage || 'An error occurred.')
    }

    message.value = responseData.message + " Redirecting to login..."
    isError.value = false
    formData.password = '' // Clear form
    formData.password_confirm = ''

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
