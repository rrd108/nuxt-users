<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { navigateTo } from '#app'
import { useAuthentication } from '../composables/useAuthentication'
import { useNuxtUsersLocale } from '../composables/useNuxtUsersLocale'

const { t } = useNuxtUsersLocale()

interface LogoutLinkProps {
  redirectTo?: string
  linkText?: string
  confirmMessage?: string
  loggingOutText?: string
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
  redirectTo: '/login'
})

const emit = defineEmits<Emits>()

// Initialize the composable state as null initially
let authComposable: ReturnType<typeof useAuthentication> | null = null
const isLoading = ref(false)
const error = ref('')

onMounted(() => {
  // Initialize the composable only after the component is mounted
  authComposable = useAuthentication()
})

const handleLogout = async (event: Event) => {
  event.preventDefault()

  if (!confirm(props.confirmMessage || t('logout.confirmMessage'))) {
    return
  }

  if (!authComposable) {
    error.value = 'Authentication not initialized'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    emit('click')
    await authComposable.logout()
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
    :class="['n-users-logout-container', props.containerClass]"
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
        <span v-if="isLoading">{{ props.loggingOutText || t('logout.loggingOut') }}</span>
        <span v-else>{{ props.linkText || t('logout.linkText') }}</span>
      </slot>
    </a>
  </div>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
