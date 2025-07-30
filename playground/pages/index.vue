<script setup>
const handleSuccess = (user) => {
  console.log('[Nuxt Users] Login successful:', user)
  alert(`Welcome back, ${user.name}!`)
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
    <h1>Nuxt Users - Login Component Demo</h1>

    <div class="demo-section">
      <h2>Default Login Form</h2>
      <p>This is the default login form with all default styling and content.</p>
      <LoginForm
        @success="handleSuccess"
        @error="handleError"
        @submit="handleSubmit"
      />
      <div style="text-align: center; margin-top: 1em;">
        <NuxtLink to="/forgot-password">Forgot Password?</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2em;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.demo-container h1 {
  text-align: center;
  color: var(--color-gray-800);
  margin-bottom: 3em;
  font-size: 2.5rem;
  font-weight: 700;
}

.demo-section {
  margin-bottom: 4em;
  padding: 2em;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-secondary);
}

.demo-section h2 {
  color: var(--color-gray-700);
  margin-bottom: 0.5em;
  font-size: 1.5rem;
  font-weight: 600;
}

.demo-section p {
  color: var(--color-gray-500);
  margin-bottom: 2em;
  font-size: 0.875rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .demo-container {
    padding: 1em;
  }

  .demo-section {
    padding: 1.5em;
  }

  .demo-container h1 {
    font-size: 2rem;
  }
}
</style>
