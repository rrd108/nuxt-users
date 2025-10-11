<script setup>
import { useAuthentication } from '#imports'

const { login } = useAuthentication()

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
}
</script>

<template>
  <div class="demo-container">
    <nav>
      <NuxtLink to="/profile">Profile</NuxtLink>
      <NuxtLink to="/noauth">No Auth</NuxtLink>
    </nav>

    <h1>Nuxt Users</h1>

    <div class="demo-section">
      <h2>Login Component Demo</h2>
      <p>Login with: rrd@webmania.cc / 123</p>
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
        @click="handleGoogleLogin"
        button-text="Continue with Google"
        class="google-btn"
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
