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

const hasUsersTable = useRuntimeConfig().public.nuxtUsers?.tables?.users ?? false
const hasPersonalAccessTokensTable = useRuntimeConfig().public.nuxtUsers?.tables?.personalAccessTokens ?? false
</script>

<template>
  <div class="demo-container">
    <h1>Nuxt Users - Login Component Demo</h1>

    <div
      v-if="!hasUsersTable || !hasPersonalAccessTokensTable"
      class="db-error"
    >
      <h2>⚠️ Tables</h2>
      <p>❌ Users table is not created, execute <code>yarn db:create-users-table</code></p>
      <p>❌ Personal access tokens table is not created, execute <code>yarn db:create-personal-access-tokens-table</code></p>
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
      <div style="text-align: center; margin-top: 1rem;">
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
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.demo-container h1 {
  text-align: center;
  color: #1f2937;
  margin-bottom: 3rem;
  font-size: 2.5rem;
  font-weight: 700;
}

.demo-section {
  margin-bottom: 4rem;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
}

.demo-section h2 {
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.demo-section p {
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 0.875rem;
}

/* Custom header styles */
.custom-header {
  text-align: center;
  margin-bottom: 1rem;
}

.custom-title {
  font-size: 2rem;
  font-weight: 800;
  color: #059669;
  margin: 0 0 0.5rem 0;
}

.custom-subtitle {
  font-size: 1rem;
  color: #047857;
  margin: 0;
}

/* Custom form field styles */
.custom-form-field {
  --fk-border-radius: 12px;
  --fk-border-color: #059669;
  --fk-border-color-focus: #047857;
  --fk-bg-color: #f0fdf4;
  --fk-bg-color-focus: #ffffff;
}

/* Custom submit button styles */
.custom-submit-button {
  background-color: #059669 !important;
  border-color: #059669 !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  padding: 1rem !important;
}

.custom-submit-button:hover:not(:disabled) {
  background-color: #047857 !important;
  border-color: #047857 !important;
}

.db-error {
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #92400e;
  width: fit-content;

  code {
    display: block;
    background-color: #ccc;
    color: #000;
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
  padding: 1rem;
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-size: 0.875rem;
  margin-top: 1rem;
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
  color: #1f2937;
  text-align: center;
  margin: 0 0 2rem 0;
}

.minimal-field {
  --fk-border-radius: 4px;
  --fk-border-color: #d1d5db;
  --fk-border-color-focus: #3b82f6;
  --fk-bg-color: #ffffff;
  --fk-bg-color-focus: #ffffff;
  --fk-padding: 0.5rem 0.75rem;
}

.minimal-button {
  background-color: #1f2937 !important;
  border-color: #1f2937 !important;
  font-weight: 500 !important;
  padding: 0.75rem !important;
}

.minimal-button:hover:not(:disabled) {
  background-color: #111827 !important;
  border-color: #111827 !important;
}

.minimal-footer {
  text-align: center;
  margin-top: 1rem;
}

.minimal-footer p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.minimal-footer a {
  color: #3b82f6;
  text-decoration: none;
}

.minimal-footer a:hover {
  text-decoration: underline;
}

/* Responsive design */
@media (max-width: 768px) {
  .demo-container {
    padding: 1rem;
  }

  .demo-section {
    padding: 1.5rem;
  }

  .demo-container h1 {
    font-size: 2rem;
  }
}
</style>
