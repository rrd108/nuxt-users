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
    <!-- Default usage - uses NUsersUserCard with built-in Edit/Delete buttons -->
    <NUsersList
      @edit-click="handleEditClick"
      @delete="() => {}"
    />

    <!-- Example: Custom user slot with access to default Edit/Delete buttons -->
    <!--
    <NUsersList
      @edit-click="handleEditClick"
      @delete="() => {}"
    >
      <template #user="{ user, index, editUser, deleteUser }">
        <div class="custom-user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>

          <!-- You can use the default Edit/Delete buttons -->
    <div class="actions">
      <button @click="editUser">
        Edit User
      </button>
      <button @click="deleteUser">
        Delete User
      </button>
    </div>
  </div>
</template>
    </NUsersList>
    -->

    <!-- Example: Custom user slot with custom Edit/Delete buttons -->
    <!--
    <NUsersList
      @edit-click="handleEditClick"
      @delete="() => {}"
    >
      <template #user="{ user, index, editUser, deleteUser }">
        <div class="custom-user-card">
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>

          <!-- Custom buttons that call the same functions -->
          <div class="actions">
            <button class="custom-edit-btn" @click="editUser">
              ✏️ Edit
            </button>
            <button class="custom-delete-btn" @click="deleteUser">
              🗑️ Delete
            </button>
          </div>
        </div>
      </template>
    </NUsersList>
    -->
  </div>
</template>

<style scoped>
</style>
