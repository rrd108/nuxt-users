<template>
  <div>
    <h1>Reset Your Password</h1>
    <p>Enter your new password below.</p>
    <ResetPasswordForm />
    <hr />
    <NuxtLink to="/login">Back to Login</NuxtLink>
  </div>
</template>

<script setup lang="ts">
// No specific script needed for this page wrapper
// ResetPasswordForm component handles its own logic,
// including reading token from URL query params.
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
