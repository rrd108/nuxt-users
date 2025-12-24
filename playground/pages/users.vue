<script setup lang="ts">
import { ref } from 'vue'
import { useUsers } from '../../src/runtime/composables/useUsers'
import type { User } from '../../src/types'

const { updateUser } = useUsers()

const selectedUser = ref<User | null>(null)
const filter = ref<Partial<User>>({})

const handleEditClick = (user: User) => {
  selectedUser.value = user
}

const handleUserUpdated = (userData: Partial<User>) => {
  console.log('User updated:', userData)
  selectedUser.value = null
  // Update the user in the local state using the composable
  if (userData.id) {
    updateUser(userData as User)
  }
}

const updateFilter = (field: keyof User, value: string) => {
  if (value.trim() === '') {
    const { [field]: _, ...rest } = filter.value
    filter.value = rest
  }
  if (value.trim()) {
    filter.value = { ...filter.value, [field]: value }
  }
}
</script>

<template>
  <div>
    <NUsersUserForm
      :user="selectedUser"
      @submit="handleUserUpdated"
    />

    <!-- Filter Controls -->
    <div style="margin: 20px 0; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
      <h3>Filter Users</h3>
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <input
          type="text"
          placeholder="Filter by name..."
          :value="filter.name || ''"
          style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
          @input="updateFilter('name', ($event.target as HTMLInputElement).value)"
        >
        <input
          type="text"
          placeholder="Filter by role..."
          :value="filter.role || ''"
          style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
          @input="updateFilter('role', ($event.target as HTMLInputElement).value)"
        >
        <input
          type="text"
          placeholder="Filter by email..."
          :value="filter.email || ''"
          style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
          @input="updateFilter('email', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div style="font-size: 14px; color: #666;">
        Current filter: {{ JSON.stringify(filter) }}
      </div>
    </div>

    <!-- Default usage - uses NUsersUserCard with built-in Edit/Delete buttons -->
    <NUsersList
      :filter="filter"
      @edit-click="handleEditClick"
      @delete="() => {}"
    />
  </div>
</template>

<style scoped>
</style>
