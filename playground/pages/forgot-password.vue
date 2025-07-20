<template>
  <div>
    <h1>Forgot Your Password?</h1>
    <p>Enter your email address below and we'll send you a link to reset your password.</p>
    <ForgotPasswordForm />
    <hr>
    <NuxtLink to="/login">Back to Login</NuxtLink>
  </div>
</template>

<script setup lang="ts">
// No specific script needed for this page wrapper
// ForgotPasswordForm component handles its own logic
</script>

<style scoped>
div {
  max-width: 500px;
  margin: 2em auto;
  padding: 2em;
  border: 1px solid var(--color-border-dark);
  border-radius: 8px;
}
hr {
  margin: 1.5em 0;
}
</style>
