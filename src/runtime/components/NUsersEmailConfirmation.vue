<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#app'
import { useNuxtUsersLocale } from '../composables/useNuxtUsersLocale'

const { t } = useNuxtUsersLocale()

// Get status and message from URL query parameters
const route = useRoute()
const status = computed(() => route.query.status as string)
const message = computed(() => route.query.message as string)

const isSuccess = computed(() => status.value === 'success')
const isError = computed(() => status.value === 'error')

// Props for customization
interface Props {
  successTitle?: string
  errorTitle?: string
  loginButtonText?: string
  backToLoginText?: string
  processingTitle?: string
  processingMessage?: string
  successMessage?: string
  errorMessage?: string
  loginUrl?: string
  showLoginButton?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  loginUrl: '/login',
  showLoginButton: true
})
</script>

<template>
  <div class="n-users-section">
    <div class="n-users-card">
      <!-- Success state -->
      <div
        v-if="isSuccess"
        class="n-users-confirmation-content"
      >
        <slot name="success-icon">
          <div class="n-users-confirmation-icon n-users-confirmation-success">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="m9 12 2 2 4-4" />
              <circle
                cx="12"
                cy="12"
                r="10"
              />
            </svg>
          </div>
        </slot>

        <div class="n-users-section-header">
          <slot name="success-content">
            <h1 class="n-users-login-title">
              {{ _props.successTitle || t('emailConfirmation.successTitle') }}
            </h1>
            <div class="n-users-success-message">
              {{ message || _props.successMessage || t('emailConfirmation.successMessage') }}
            </div>
          </slot>
        </div>

        <slot name="success-actions">
          <div
            v-if="showLoginButton"
            class="n-users-form-actions"
          >
            <a
              :href="_props.loginUrl"
              class="n-users-btn n-users-btn-primary"
            >
              {{ _props.loginButtonText || t('emailConfirmation.loginButton') }}
            </a>
          </div>
        </slot>
      </div>

      <!-- Error state -->
      <div
        v-if="isError"
        class="n-users-confirmation-content"
      >
        <slot name="error-icon">
          <div class="n-users-confirmation-icon n-users-confirmation-error">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
              />
              <line
                x1="15"
                y1="9"
                x2="9"
                y2="15"
              />
              <line
                x1="9"
                y1="9"
                x2="15"
                y2="15"
              />
            </svg>
          </div>
        </slot>

        <div class="n-users-section-header">
          <slot name="error-content">
            <h1 class="n-users-login-title">
              {{ _props.errorTitle || t('emailConfirmation.errorTitle') }}
            </h1>
            <div class="n-users-error-message">
              {{ message || _props.errorMessage || t('emailConfirmation.errorMessage') }}
            </div>
          </slot>
        </div>

        <slot name="error-actions">
          <div class="n-users-form-actions">
            <a
              :href="_props.loginUrl"
              class="n-users-btn n-users-btn-secondary"
            >
              {{ _props.backToLoginText || t('emailConfirmation.backToLogin') }}
            </a>
          </div>
        </slot>
      </div>

      <!-- Loading/unknown state -->
      <div
        v-if="!isError"
        class="n-users-confirmation-content"
      >
        <slot name="loading-content">
          <div class="n-users-confirmation-icon">
            <div class="n-users-loading-spinner n-users-confirmation-spinner" />
          </div>
          <div class="n-users-section-header">
            <h1 class="n-users-login-title">
              {{ _props.processingTitle || t('emailConfirmation.processing') }}
            </h1>
            <div class="n-users-form-help">
              {{ _props.processingMessage || t('emailConfirmation.processingMessage') }}
            </div>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Only add minimal styles needed for this specific component */
.n-users-confirmation-content {
  text-align: center;
  padding: 2rem;
}

.n-users-confirmation-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.n-users-confirmation-icon svg {
  width: 40px;
  height: 40px;
}

.n-users-confirmation-success {
  background-color: var(--nu-color-success-light);
  color: var(--nu-color-success);
}

.n-users-confirmation-error {
  background-color: var(--nu-color-error-light);
  color: var(--nu-color-error);
}

.n-users-confirmation-spinner {
  width: 40px;
  height: 40px;
  border-width: 4px;
  border-color: var(--nu-color-primary);
  border-top-color: transparent;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .n-users-confirmation-content {
    padding: 1.5rem;
  }

  .n-users-confirmation-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 1.5rem;
  }

  .n-users-confirmation-icon svg {
    width: 30px;
    height: 30px;
  }
}
</style>
