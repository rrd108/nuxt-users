<script setup lang="ts">
import { ref } from 'vue'
import type { UserWithoutPassword } from 'nuxt-users/utils'
import { usePasskeys } from '../composables/usePasskeys'
import { useNuxtUsersLocale } from '../composables/useNuxtUsersLocale'

const { t } = useNuxtUsersLocale()

interface Props {
  /**
   * Button text
   */
  buttonText?: string
  /**
   * Text while waiting for the device
   */
  loadingText?: string
  /**
   * Keep the user signed in (long-lived cookie)
   * @default false
   */
  rememberMe?: boolean
  /**
   * Custom CSS class for button
   */
  class?: string
}

interface Emits {
  (e: 'success', user: UserWithoutPassword, rememberMe: boolean): void
  (e: 'error', error: string): void
}

const props = withDefaults(defineProps<Props>(), {
  rememberMe: false
})

const emit = defineEmits<Emits>()

const { enabled, supported, login } = usePasskeys()
const isLoading = ref(false)

const extractErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'statusMessage' in err.data) {
    return String(err.data.statusMessage)
  }
  return t('passkey.loginFailed')
}

const handlePasskeyLogin = async () => {
  isLoading.value = true
  try {
    const user = await login(props.rememberMe)
    if (!user) {
      emit('error', t('passkey.cancelled'))
      return
    }
    emit('success', user, props.rememberMe)
  }
  catch (err: unknown) {
    emit('error', extractErrorMessage(err))
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <button
    v-if="enabled && supported"
    type="button"
    class="n-users-passkey-btn"
    :class="[{ loading: isLoading }, props.class]"
    :disabled="isLoading"
    @click="handlePasskeyLogin"
  >
    <span
      v-if="isLoading"
      class="n-users-loading-spinner"
    />
    <span class="n-users-passkey-text">
      {{ isLoading ? (props.loadingText || t('passkey.loggingIn')) : (props.buttonText || t('passkey.loginButton')) }}
    </span>
  </button>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
