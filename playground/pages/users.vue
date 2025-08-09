<script setup lang="ts">
import { ref } from 'vue'
import type { User } from '../../src/types'

const usersListRef = ref()

const refreshUserList = () => {
  console.log('refreshUserList')
  if (usersListRef.value) {
    usersListRef.value.refresh()
  }
}

const selectedUser = ref<User | null>(null)
const handleEditClick = (user: User) => {
  selectedUser.value = user
}
</script>

<template>
  <div>
    <NUsersUserForm
      :user="selectedUser"
      @submit="refreshUserList"
    />
    <NUsersList
      ref="usersListRef"
      @edit-click="handleEditClick"
      @delete="refreshUserList"
    />
  </div>
</template>

<style scoped>
</style>
