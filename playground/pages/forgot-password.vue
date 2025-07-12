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
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
hr {
  margin: 1.5rem 0;
}
</style>
