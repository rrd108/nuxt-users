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

    <div class="demo-section">
      <h2>Custom Header Login Form</h2>
      <p>This form uses a custom header slot to change the title and subtitle.</p>
      <LoginForm
        @success="handleSuccess"
        @error="handleError"
        @submit="handleSubmit"
      >
        <template #header>
          <div class="custom-header">
            <h2 class="custom-title">
              Welcome to Our App
            </h2>
            <p class="custom-subtitle">
              Please sign in to continue
            </p>
          </div>
        </template>
      </LoginForm>
    </div>

    <div class="demo-section">
      <h2>Custom Email Field</h2>
      <p>This form uses a custom email field with different validation and styling.</p>
      <LoginForm
        @success="handleSuccess"
        @error="handleError"
        @submit="handleSubmit"
      >
        <template #email-field>
          <FormKit
            type="email"
            name="email"
            label="Email Address"
            placeholder="your.email@example.com"
            validation="required|email"
            :validation-messages="{
              required: 'Please enter your email address',
              email: 'Please enter a valid email address',
            }"
            class="custom-form-field"
          />
        </template>
      </LoginForm>
    </div>

    <div class="demo-section">
      <h2>Custom Submit Button</h2>
      <p>This form uses a custom submit button with different text and styling.</p>
      <LoginForm
        @success="handleSuccess"
        @error="handleError"
        @submit="handleSubmit"
      >
        <template #submit-button>
          <FormKit
            type="submit"
            :disabled="false"
            class="custom-submit-button"
          >
            Login to My App
          </FormKit>
        </template>
      </LoginForm>
    </div>

    <div class="demo-section">
      <h2>Custom Error Message</h2>
      <p>This form uses a custom error message slot to show errors differently.</p>
      <LoginForm
        @success="handleSuccess"
        @error="handleError"
        @submit="handleSubmit"
      >
        <template #error-message="{ error }">
          <div
            v-if="error"
            class="custom-error"
          >
            <span class="error-icon">⚠️</span>
            <span class="error-text">{{ error }}</span>
          </div>
        </template>
      </LoginForm>
    </div>

    <div class="demo-section">
      <h2>Completely Custom Form</h2>
      <p>This form replaces most slots to create a completely custom look.</p>
      <LoginForm
        @success="handleSuccess"
        @error="handleError"
        @submit="handleSubmit"
      >
        <template #header>
          <div class="minimal-header">
            <h2>Sign In</h2>
          </div>
        </template>

        <template #email-field>
          <FormKit
            type="email"
            name="email"
            label="Email"
            placeholder="Email"
            validation="required|email"
            class="minimal-field"
          />
        </template>

        <template #password-field>
          <FormKit
            type="password"
            name="password"
            label="Password"
            placeholder="Password"
            validation="required|length:6"
            class="minimal-field"
          />
        </template>

        <template #submit-button>
          <FormKit
            type="submit"
            class="minimal-button"
          >
            Sign In
          </FormKit>
        </template>

        <template #footer>
          <div class="minimal-footer">
            <p>Don't have an account? <a href="#">Sign up</a></p>
          </div>
        </template>
      </LoginForm>
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

.custom-header {
  text-align: center;
  margin-bottom: 1em;
}

.custom-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-secondary);
  margin: 0 0 0.5em 0;
}

.custom-subtitle {
  font-size: 1rem;
  color: var(--color-secondary-dark);
  margin: 0;
}

.custom-form-field {
  --fk-border-radius: 12px;
  --fk-border-color: var(--color-secondary);
  --fk-border-color-focus: var(--color-secondary-dark);
  --fk-bg-color: var(--color-success-light);
  --fk-bg-color-focus: var(--color-bg-primary);
}

.custom-submit-button {
  background-color: var(--color-secondary) !important;
  border-color: var(--color-secondary) !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  padding: 1em !important;
}

.custom-submit-button:hover:not(:disabled) {
  background-color: var(--color-secondary-dark) !important;
  border-color: var(--color-secondary-dark) !important;
}

.db-error {
  background-color: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: 8px;
  padding: 1em 2em;
  margin: 1em auto;
  color: var(--color-warning-text);
  width: fit-content;

  code {
    display: block;
    background-color: var(--color-border-dark);
    color: var(--color-black);
    padding: .5em;
    margin: .5em;
    border-radius: 4px;
  }
}

/* Custom error styles */
.custom-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1em;
  background-color: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: 8px;
  color: var(--color-warning-text);
  font-size: 0.875rem;
  margin-top: 1em;
}

.error-icon {
  font-size: 1rem;
}

.error-text {
  font-weight: 500;
}

/* Minimal styles */
.minimal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-gray-800);
  text-align: center;
  margin: 0 0 2em 0;
}

.minimal-field {
  --fk-border-radius: 4px;
  --fk-border-color: var(--color-border-light);
  --fk-border-color-focus: var(--color-primary);
  --fk-bg-color: var(--color-bg-primary);
  --fk-bg-color-focus: var(--color-bg-primary);
  --fk-padding: 0.5em 0.75em;
}

.minimal-button {
  background-color: var(--color-gray-800) !important;
  border-color: var(--color-gray-800) !important;
  font-weight: 500 !important;
  padding: 0.75em !important;
}

.minimal-button:hover:not(:disabled) {
  background-color: var(--color-gray-900) !important;
  border-color: var(--color-gray-900) !important;
}

.minimal-footer {
  text-align: center;
  margin-top: 1em;
}

.minimal-footer p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.minimal-footer a {
  color: var(--color-primary);
  text-decoration: none;
}

.minimal-footer a:hover {
  text-decoration: underline;
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
