<template>
  <div>
    <h1>Reset Your Password</h1>
    <p>Enter your new password below.</p>
    <NUsersResetPasswordForm />
    <hr>
    <NuxtLink to="/login">Back to Login</NuxtLink>
  </div>
</template>

<script setup lang="ts">
// No specific script needed for this page wrapper
// NUsersResetPasswordForm component handles its own logic,
// including reading token from URL query params.
</script>

<style scoped>
div {
  max-width: 500px;
  margin: 2em auto;
  padding: 2em;
  border: 1px solid var(--color-border-dark);
  border-radius: .5em;
}
hr {
  margin: 1.5em 0;
}
</style>
