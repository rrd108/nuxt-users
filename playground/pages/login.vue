<script setup>
import { useAuthentication } from '#imports'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const { login } = useAuthentication()
const route = useRoute()
const oauthError = ref('')

const errorMessages = {
  oauth_failed: 'Authentication failed. Please try again.',
  user_not_registered: 'You are not registered. Please contact an administrator or register first.',
  account_inactive: 'Your account is inactive. Please contact support.',
  oauth_not_configured: 'OAuth is not properly configured.'
}

onMounted(() => {
  const errorParam = route.query.error
  if (errorParam && errorMessages[errorParam]) {
    oauthError.value = errorMessages[errorParam]
  }
})

const handleSuccess = (user, rememberMe) => {
  console.log('[Nuxt Users] Login successful:', user, 'Remember me:', rememberMe)
  // Pass the rememberMe flag to the login composable
  login(user, rememberMe)
  navigateTo('/')
}

const handleError = (error) => {
  console.log('[Nuxt Users] Login error:', error)
}

const handleSubmit = (data) => {
  console.log('[Nuxt Users] Form submitted:', data)
  // The login composable will now handle the rememberMe flag automatically
  // when the server responds with user data after successful authentication
}

const handleGoogleLogin = () => {
  console.log('[Nuxt Users] Starting Google OAuth flow')
  oauthError.value = '' // Clear any existing errors
}

const dismissError = () => {
  oauthError.value = ''
}
</script>

<template>
  <div class="demo-container">
    <nav>
      <NuxtLink to="/profile">Profile</NuxtLink>
      <NuxtLink to="/noauth">No Auth</NuxtLink>
      <NuxtLink to="/register">Register</NuxtLink>
    </nav>

    <h1>Nuxt Users</h1>

    <div class="demo-section">
      <h2>Login Component Demo</h2>
    </div>

    <div
      v-if="oauthError"
      class="error-banner"
    >
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">{{ oauthError }}</span>
        <button
          class="error-dismiss"
          @click="dismissError"
        >
          ✕
        </button>
      </div>
    </div>

    <NUsersLoginForm
      @success="handleSuccess"
      @error="handleError"
      @submit="handleSubmit"
    />

    <div class="oauth-divider">
      <span>or</span>
    </div>

    <div class="oauth-section">
      <h3>OAuth Login</h3>
      <p>Click below to test Google OAuth (requires valid credentials in .env)</p>
      <NUsersGoogleLoginButton
        button-text="Continue with Google"
        class="google-btn"
        @click="handleGoogleLogin"
      />
    </div>
  </div>
</template>

<style scoped>
nav {
  display: flex;
  gap: 1em;
  justify-content: center;
}
nav a {
  text-decoration: none;
  color: var(--nu-color-gray-700);
}

.demo-container {
  max-width: 75rem;
  margin: 0 auto;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.demo-container h1 {
  text-align: center;
  margin-bottom: 1em;
  color: var(--nu-color-gray-700);
  font-size: 2rem;
  font-weight: 700;
}

.demo-section {
  margin-bottom: 1em;
  border: 1px solid var(--nu-color-border);
  border-radius: 12px;
  background: var(--nu-color-bg-secondary);
}

.demo-section h2 {
  color: var(--nu-color-gray-700);
  margin-bottom: 0.5em;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.demo-section p {
  color: var(--nu-color-gray-500);
  margin-bottom: 2em;
  font-size: 0.875rem;
  text-align: center;
}

.oauth-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 2rem 0;
}

.oauth-divider::before,
.oauth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--nu-color-border);
}

.oauth-divider span {
  padding: 0 1rem;
  color: var(--nu-color-gray-500);
  font-size: 0.875rem;
  background: var(--nu-color-bg);
}

.oauth-section {
  text-align: center;
  margin-top: 2rem;
}

.oauth-section h3 {
  color: var(--nu-color-gray-700);
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.oauth-section p {
  color: var(--nu-color-gray-500);
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.google-btn {
  margin: 0 auto;
}

.error-banner {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.error-message {
  flex: 1;
  color: #991b1b;
  font-size: 0.875rem;
  font-weight: 500;
}

.error-dismiss {
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.error-dismiss:hover {
  background-color: #fee2e2;
}

/* Responsive design */
@media (max-width: 48rem) {
  .demo-container {
    padding: .5em;
  }

  .demo-section {
    padding: .5em;
  }

  .demo-container h1 {
    font-size: 2rem;
  }
}
</style>
