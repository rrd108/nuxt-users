<template>
  <div>
    <NUsersEmailConfirmation />
  </div>
</template>

<script setup>
// Set page title and meta tags
useHead({
  title: 'Email Confirmation - Nuxt Users',
  meta: [
    { name: 'description', content: 'Confirm your email address to activate your account' }
  ]
})

// This is an example page that consumer apps can create
// Users just need to create pages/email-confirmation.vue (or whatever path they configure)
// and use the NUsersEmailConfirmation component
</script>
