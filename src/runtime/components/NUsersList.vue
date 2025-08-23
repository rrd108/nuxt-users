<script setup lang="ts">
import { onMounted } from 'vue'
import { useUsers } from '../composables/useUsers'
import { defaultDisplayFields, defaultFieldLabels, type User } from 'nuxt-users/utils'

// Note: We define Props interface inline instead of importing DisplayFieldsProps from 'nuxt-users/utils'
// because the Vue SFC transformer cannot resolve these imported types during the module build process
interface Props {
  displayFields?: string[]
  fieldLabels?: Record<string, string>
}

withDefaults(defineProps<Props>(), {
  displayFields: () => defaultDisplayFields,
  fieldLabels: () => defaultFieldLabels
})

const emit = defineEmits<{
  (e: 'editClick' | 'delete', user: User): void
}>()

const {
  users,
  pagination,
  loading,
  error,
  fetchUsers,
  removeUser
} = useUsers()

onMounted(() => {
  // Fetch users only if the list is empty to avoid unnecessary fetches
  if (users.value.length === 0) {
    fetchUsers()
  }
})

const handleDelete = (user: User) => {
  removeUser(user.id)
  emit('delete', user)
}
</script>

<template>
  <div class="n-users-list">
    <slot name="title">
      <h2>
        Users List
      </h2>
    </slot>

    <slot
      name="loading"
      :loading="loading"
    >
      <div v-if="loading">
        Loading users...
      </div>
    </slot>

    <slot
      name="error"
      :error="error"
    >
      <div v-if="error">
        Error: {{ error }}
      </div>
    </slot>

    <slot name="noUsers">
      <div v-if="users.length === 0">
        No users found
      </div>
    </slot>

    <div v-if="users.length">
      <slot name="usersList">
        <TransitionGroup
          name="n-users-list"
          tag="ul"
          class="n-users-grid n-users-grid-auto"
        >
          <li
            v-for="(user, index) in users"
            :key="user.id"
          >
            <slot
              name="user"
              :user="user"
              :index="index"
            >
              <NUsersUserCard
                :user="user"
                :index="index"
                :display-fields="displayFields"
                :field-labels="fieldLabels"
                @edit-click="$emit('editClick', user)"
                @delete="handleDelete(user)"
              />
            </slot>
          </li>
        </TransitionGroup>
      </slot>

      <slot
        name="paginationInfo"
        :pagination="pagination"
      >
        <div v-if="pagination && pagination.totalPages > 1">
          <div>
            <span>Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
            <span>Total: {{ pagination.total }} users</span>
          </div>
        </div>
      </slot>

      <slot
        name="pagination"
        :pagination="pagination"
        :fetch-users="fetchUsers"
        :loading="loading"
      >
        <div v-if="pagination && pagination.totalPages > 1">
          <div>
            <button
              v-if="pagination.hasPrev"
              :disabled="loading"
              @click="fetchUsers(pagination.page - 1)"
            >
              Previous
            </button>

            <button
              v-if="pagination.hasNext"
              :disabled="loading"
              @click="fetchUsers(pagination.page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>
