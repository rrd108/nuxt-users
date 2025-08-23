<script setup lang="ts">
import { ref } from 'vue'
import { useUsers } from '../../src/runtime/composables/useUsers'
import type { User } from '../../src/types'

const { updateUser } = useUsers()

const selectedUser = ref<User | null>(null)
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
</script>

<template>
  <div>
    <NUsersUserForm
      :user="selectedUser"
      @submit="handleUserUpdated"
    />
    <NUsersList
      @edit-click="handleEditClick"
      @delete="() => {}"
    />
  </div>
</template>

<style scoped>
</style>
