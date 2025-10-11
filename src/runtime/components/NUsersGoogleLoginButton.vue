<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'

interface Props {
  /**
   * Custom redirect endpoint for Google OAuth
   * @default '/api/nuxt-users/auth/google/redirect'
   */
  redirectEndpoint?: string
  /**
   * Button text
   * @default 'Continue with Google'
   */
  buttonText?: string
  /**
   * Show Google logo in button
   * @default true
   */
  showLogo?: boolean
  /**
   * Custom CSS class for button
   */
  class?: string
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  buttonText: 'Continue with Google',
  showLogo: true
})

const emit = defineEmits<Emits>()

const { public: { nuxtUsers } } = useRuntimeConfig()
const { apiBasePath } = nuxtUsers as ModuleOptions

const isLoading = ref(false)

// Compute redirect URL
const redirectEndpoint = computed(() => 
  props.redirectEndpoint || `${apiBasePath}/auth/google/redirect`
)

const handleGoogleLogin = async () => {
  isLoading.value = true
  emit('click')
  
  try {
    // Navigate to Google OAuth redirect endpoint
    await navigateTo(redirectEndpoint.value, { external: true })
  } catch (error) {
    console.error('[Nuxt Users] Google OAuth redirect failed:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="n-users-google-btn"
    :class="[{ 'loading': isLoading }, props.class]"
    :disabled="isLoading"
    @click="handleGoogleLogin"
  >
    <!-- Loading spinner -->
    <span
      v-if="isLoading"
      class="n-users-loading-spinner"
    />
    
    <!-- Google logo SVG -->
    <svg
      v-if="showLogo && !isLoading"
      class="n-users-google-logo"
      viewBox="0 0 24 24"
      width="18"
      height="18"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>

    <!-- Button text -->
    <span class="n-users-google-text">
      {{ isLoading ? 'Redirecting...' : buttonText }}
    </span>
  </button>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->