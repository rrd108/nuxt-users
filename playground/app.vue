<template>
  <div>
    <h1>Nuxt Users Playground</h1>

    <div v-if="isAuthenticated">
      <h2>Welcome, {{ user?.email }}!</h2>
      <button @click="handleLogout">Logout</button>
      <pre>{{ user }}</pre>
      <p>Token: {{ token?.substring(0, 20) }}...</p>
    </div>

    <div v-else>
      <h2>Login or Register</h2>
      <div>
        <h3>Login</h3>
        <form @submit.prevent="handleLogin">
          <input v-model="loginForm.email" type="email" placeholder="Email" required />
          <input v-model="loginForm.password" type="password" placeholder="Password" required />
          <input v-model="loginForm.deviceName" type="text" placeholder="Device Name (optional)" />
          <button type="submit">Login</button>
        </form>
        <p v-if="loginError" style="color: red;">{{ loginError }}</p>
      </div>

      <div>
        <h3>Register</h3>
        <form @submit.prevent="handleRegister">
          <input v-model="registerForm.email" type="email" placeholder="Email" required />
          <input v-model="registerForm.password" type="password" placeholder="Password" required />
          <button type="submit">Register</button>
        </form>
        <p v-if="registerError" style="color: red;">{{ registerError }}</p>
        <p v-if="registerSuccess" style="color: green;">{{ registerSuccess }}</p>
      </div>
    </div>
    <hr/>
    <button @click="handleFetchUser">Manually Fetch User (if token exists)</button>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuth } from '#imports' // Should be auto-imported if module is set up correctly

const { user, token, isAuthenticated, login, register, logout, fetchUser } = useAuth()

const loginForm = reactive({
  email: '',
  password: '',
  deviceName: 'playground-device'
})
const loginError = ref('')

const registerForm = reactive({
  email: '',
  password: ''
})
const registerError = ref('')
const registerSuccess = ref('')

const handleLogin = async () => {
  loginError.value = ''
  try {
    await login(loginForm)
    // Reset form if needed
    loginForm.email = ''
    loginForm.password = ''
  } catch (error) {
    loginError.value = error.data?.message || error.message || 'Login failed.'
    console.error('Login error in component:', error)
  }
}

const handleRegister = async () => {
  registerError.value = ''
  registerSuccess.value = ''
  try {
    await register(registerForm)
    registerSuccess.value = 'Registration successful! Please log in.'
    // Reset form
    registerForm.email = ''
    registerForm.password = ''
  } catch (error) {
    registerError.value = error.data?.message || error.message || 'Registration failed.'
    console.error('Register error in component:', error)
  }
}

const handleLogout = async () => {
  await logout()
}

const handleFetchUser = async () => {
  try {
    await fetchUser()
    if(!user.value) {
      alert('Could not fetch user. Token might be invalid or not present.');
    }
  } catch (error) {
     alert('Error fetching user: ' + (error.data?.message || error.message));
  }
}

// Initial fetch user on component mount if not already handled by plugin (or to be sure)
// import { onMounted } from 'vue'
// onMounted(async () => {
//   if (!isAuthenticated.value && token.value) {
//     await fetchUser()
//   }
// })
</script>

<style>
  div { margin-bottom: 10px; }
  input { margin-right: 5px; }
  form { margin-bottom: 15px; padding: 10px; border: 1px solid #eee; }
</style>
