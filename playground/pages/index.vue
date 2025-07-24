<script setup>
const handleSuccess = (user) => {
  console.log('Login successful:', user)
  alert(`Welcome back, ${user.name}!`)
}

const handleError = (error) => {
  console.log('Login error:', error)
}

const handleSubmit = (data) => {
  console.log('Form submitted:', data)
}

const hasMigrationsTable = useRuntimeConfig().public.nuxtUsers?.tables?.migrations ?? false
const hasUsersTable = useRuntimeConfig().public.nuxtUsers?.tables?.users ?? false
const hasPersonalAccessTokensTable = useRuntimeConfig().public.nuxtUsers?.tables?.personalAccessTokens ?? false
const hasPasswordResetTokensTable = useRuntimeConfig().public.nuxtUsers?.tables?.passwordResetTokens ?? false
</script>

<template>
  <div class="demo-container">
    <h1>Nuxt Users - Login Component Demo</h1>

    <div
      v-if="!hasMigrationsTable || !hasUsersTable || !hasPersonalAccessTokensTable || !hasPasswordResetTokensTable"
      class="db-error"
    >
      <h2>⚠️ Tables</h2>
      <p v-if="!hasMigrationsTable">
        ❌ Migrations table is not created, execute <code>npx nuxt-users:migrate</code>
      </p>
      <p v-if="!hasUsersTable">
        ❌ Users table is not created, execute <code>npx nuxt-users:create-users-table</code>
      </p>
      <p v-if="!hasPersonalAccessTokensTable">
        ❌ Personal access tokens table is not created, execute <code>npx nuxt-users:create-personal-access-tokens-table</code>
      </p>
      <p v-if="!hasPasswordResetTokensTable">
        ❌ Password reset tokens table is not created, execute <code>npx nuxt-users:create-password-reset-tokens-table</code>
      </p>
      <p>After you are done you should restart the dev server!</p>
    </div>

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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

.db-error {
  background-color: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: 8px;
  padding: 1em 2em;
  margin: 1em auto;
  color: var(--color-warning-text);
  width: fit-content;
}

code {
  display: block;
  background-color: var(--color-border-dark);
  color: var(--color-black);
  padding: 0.5em;
  margin: 0.5em;
  border-radius: 4px;
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
