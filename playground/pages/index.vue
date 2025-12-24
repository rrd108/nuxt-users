<script setup lang="ts">
import { useAuthentication } from '#imports'

const { user } = useAuthentication()

// User is automatically initialized by the client plugin
// No need to manually call initializeUser() anymore
</script>

<template>
  <div class="home-page">
    <div class="container">
      <h1>Welcome to Nuxt Users</h1>

      <div
        v-if="user"
        class="user-info"
      >
        <h2>Hello, {{ user.name }}!</h2>
        <p>You are logged in as {{ user.email }}</p>

        <div class="actions">
          <NuxtLink
            to="/profile"
            class="btn btn-primary"
          >
            View Profile
          </NuxtLink>
          <NuxtLink
            to="/users"
            class="btn btn-primary"
          >
            Users List
          </NuxtLink>
          <NuxtLink
            to="/users-custom"
            class="btn btn-primary"
          >
            Custom Users List
          </NuxtLink>

          <NUsersLogoutLink class="btn btn-secondary" />
        </div>
      </div>

      <div
        v-if="!user"
        class="login-section"
      >
        <p>Please log in to access your profile</p>
        <div class="auth-actions">
          <NuxtLink
            to="/login"
            class="btn btn-primary"
          >
            Login
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="btn btn-secondary"
          >
            Register
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  text-align: center;
  color: white;
}

h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info h2 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.user-info p {
  font-size: 1.1rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

.actions,
.auth-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.login-section {
  margin-top: 20px;
}

.login-section p {
  font-size: 1.2rem;
  margin-bottom: 20px;
  opacity: 0.9;
}

.btn {
  display: inline-block;
  padding:.5em 1em;
  border-radius: .5em;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.btn-primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}
</style>
