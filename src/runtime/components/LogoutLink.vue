<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from '#app'
import { useAuth } from '../composables/useAuth'

interface LogoutLinkProps {
  redirectTo?: string
  linkText?: string
  confirmMessage?: string
  class?: string
}

interface Emits {
  (e: 'success' | 'click'): void
  (e: 'error', error: string): void
}

const props = withDefaults(defineProps<LogoutLinkProps>(), {
  redirectTo: '/login',
  linkText: 'Logout',
  confirmMessage: 'Are you sure you want to logout?'
})

const emit = defineEmits<Emits>()

const { logout } = useAuth()
const isLoading = ref(false)
const error = ref('')

const handleLogout = async (event: Event) => {
  event.preventDefault()

  if (!confirm(props.confirmMessage)) {
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    emit('click')
    await logout()
    emit('success')

    // Redirect if specified
    if (props.redirectTo) {
      await navigateTo(props.redirectTo)
    }
  }
  catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Logout failed'
    error.value = errorMessage
    emit('error', errorMessage)
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <div
      v-if="error"
      class="error-message"
    >
      {{ error }}
    </div>

    <a
      href="#"
      :class="['logout-link', { loading: isLoading }, props.class]"
      :disabled="isLoading"
      @click="handleLogout"
    >
      <span v-if="isLoading">Logging out...</span>
      <span v-else>{{ linkText }}</span>
    </a>
  </div>
</template>

<style scoped>
.logout-link {
  color: #dc3545;
  text-decoration: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s;
}

.logout-link:hover:not(.loading) {
  color: #c82333;
  text-decoration: underline;
}

.logout-link.loading {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}
</style>
