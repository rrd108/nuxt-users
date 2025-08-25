<template>
  <div>
    <Head>
      <Title>Register - Nuxt Users</Title>
    </Head>
    
    <div class="container">
      <h1>Register</h1>
      
      <NUsersRegisterForm 
        redirect-to="/login"
        login-link="/login"
        @success="onRegistrationSuccess"
        @error="onRegistrationError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserWithoutPassword } from 'nuxt-users/utils'

// Handle successful registration
const onRegistrationSuccess = (data: { user: Omit<UserWithoutPassword, 'active'>, message: string }) => {
  console.log('Registration successful:', data)
  // Additional success handling if needed
}

// Handle registration error
const onRegistrationError = (error: string) => {
  console.error('Registration error:', error)
  // Additional error handling if needed
}
</script>

<style scoped>
.container {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}
</style>
