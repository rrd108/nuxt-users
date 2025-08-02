<script setup>
import { useAuth } from '#imports'

const { login } = useAuth()

const handleSuccess = (user) => {
  console.log('[Nuxt Users] Login successful:', user)
  login(user)
}

const handleError = (error) => {
  console.log('[Nuxt Users] Login error:', error)
}

const handleSubmit = (data) => {
  console.log('[Nuxt Users] Form submitted:', data)
}
</script>

<template>
  <div class="demo-container">
    <h1>Nuxt Users</h1>

    <nav>
      <NuxtLink to="/profile">Profile</NuxtLink>
      <NuxtLink to="/noauth">No Auth</NuxtLink>
    </nav>

    <div class="demo-section">
      <h2>Login Component Demo</h2>
      <p>This is the default login form with all default styling and content.</p>
    </div>

    <LoginForm
      @success="handleSuccess"
      @error="handleError"
      @submit="handleSubmit"
    />
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
  color: var(--color-gray-800);
}

.demo-container {
  max-width: 75rem;
  margin: 0 auto;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.demo-container h1 {
  text-align: center;
  margin-bottom: 1em;
  color: var(--color-gray-800);
  font-size: 2rem;
  font-weight: 700;
}

.demo-section {
  margin-bottom: 1em;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-secondary);
}

.demo-section h2 {
  color: var(--color-gray-700);
  margin-bottom: 0.5em;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.demo-section p {
  color: var(--color-gray-500);
  margin-bottom: 2em;
  font-size: 0.875rem;
  text-align: center;
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
