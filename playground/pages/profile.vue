<script setup lang="ts">
import type { UserWithoutPassword } from '../../src/types'

const handleProfileSuccess = (user: UserWithoutPassword) => {
  console.log('Profile loaded successfully:', user)
}

const handleProfileError = (error: string) => {
  console.error('Profile error:', error)
}

const handlePasswordUpdated = () => {
  console.log('Password updated successfully')
}

const handlePasswordError = (error: string) => {
  console.error('Password update error:', error)
}
</script>

<template>
  <div class="profile-page">
    <div class="container">
      <h1>Profile</h1>
      <p class="description">
        View and manage your account information
      </p>

      <ProfileInfo />

      <ResetPasswordForm
        @success="handleProfileSuccess"
        @error="handleProfileError"
        @password-updated="handlePasswordUpdated"
        @password-error="handlePasswordError"
      />

      <div class="navigation">
        <NuxtLink
          to="/"
          class="nav-link"
        >← Back to Home</NuxtLink>
        <LogoutLink class="nav-link" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

h1 {
  color: white;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.description {
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 40px;
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 12px 20px;
  border-radius: .5em;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
