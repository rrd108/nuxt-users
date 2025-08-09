<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from '#app'
import { useAuthentication } from '../composables/useAuthentication'

interface LogoutLinkProps {
  redirectTo?: string
  linkText?: string
  confirmMessage?: string
  class?: string
  style?: string | Record<string, string | number>
  linkClass?: string
  linkStyle?: string | Record<string, string | number>
  errorClass?: string
  errorStyle?: string | Record<string, string | number>
  containerClass?: string
  containerStyle?: string | Record<string, string | number>
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

const { logout } = useAuthentication()
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
  <div
    :class="['logout-container', props.containerClass]"
    :style="props.containerStyle"
  >
    <div
      v-if="error"
      :class="['n-users-error-message', props.errorClass]"
      :style="props.errorStyle"
    >
      {{ error }}
    </div>

    <a
      href="#"
      :class="['n-users-logout-link', { loading: isLoading }, props.linkClass]"
      :style="props.linkStyle"
      :disabled="isLoading"
      @click="handleLogout"
    >
      <slot>
        <span v-if="isLoading">Logging out...</span>
        <span v-else>{{ linkText }}</span>
      </slot>
    </a>
  </div>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
