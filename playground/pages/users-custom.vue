<script setup lang="ts">
import { ref } from 'vue'
import type { User } from 'nuxt-users/utils'

// Example: Filter users based on connected data
const showOnlyAdmins = ref(false)

const adminFilter = (obj: unknown) => {
  const item = obj as User
  return item.role === 'admin'
}

// Combined filter function
const userFilter = (obj: unknown) => {
  if (!showOnlyAdmins.value) {
    return true // Show all users
  }

  let shouldShow = true

  if (showOnlyAdmins.value) {
    shouldShow = shouldShow && adminFilter(obj)
  }

  return shouldShow
}

// Object-based filter example (for simple property matching)
const objectFilter = ref<{ role?: string }>({})

const toggleObjectFilter = () => {
  objectFilter.value = objectFilter.value.role ? {} : { role: 'admin' }
}
</script>

<template>
  <div>
    <div class="filter-controls">
      <button @click="showOnlyAdmins = !showOnlyAdmins">
        {{ showOnlyAdmins ? 'Show All Users' : 'Show Only Admins' }}
      </button>

      <button @click="toggleObjectFilter">
        {{ objectFilter.role ? 'Clear Object Filter' : 'Filter by Admin Role' }}
      </button>
    </div>

    <!-- Using function-based filter -->
    <h3>Function-based Filter (for complex logic):</h3>
    <NUsersList :filter="userFilter">
      <template #user="{ user }">
        <div class="user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <p>Role: {{ user.role }}</p>
        </div>
      </template>
    </NUsersList>

    <!-- Using object-based filter -->
    <h3>Object-based Filter (for simple property matching):</h3>
    <NUsersList :filter="objectFilter">
      <template #user="{ user }">
        <div class="user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <p>Role: {{ user.role }}</p>
        </div>
      </template>
    </NUsersList>
  </div>
</template>

<style scoped>
.filter-controls {
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
}

.filter-controls button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.filter-controls button:hover {
  background-color: #0056b3;
}

.user-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #f9f9f9;
}

.user-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.user-card p {
  margin: 0.25rem 0;
  color: #666;
}

h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #333;
}
</style>
