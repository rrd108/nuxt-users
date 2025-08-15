<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRuntimeConfig } from '#imports'
import { defaultDisplayFields, defaultFieldLabels, type DisplayFieldsProps, type User } from '#nuxt-users/types'

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface UsersResponse {
  users: User[]
  pagination: Pagination
}

withDefaults(defineProps<DisplayFieldsProps>(), {
  displayFields: () => defaultDisplayFields,
  fieldLabels: () => defaultFieldLabels
})

defineEmits<{
  (e: 'editClick' | 'delete', user: User): void
}>()

const { public: { nuxtUsers } } = useRuntimeConfig()
const users = ref<User[]>([])
const pagination = ref<Pagination | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const fetchUsers = async (page = 1, limit = 100) => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<UsersResponse>(`${nuxtUsers.apiBasePath}?page=${page}&limit=${limit}`)
    users.value = response.users
    pagination.value = response.pagination
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch users'
  }
  finally {
    loading.value = false
  }
}

// Expose refresh method for parent components
const refresh = () => {
  fetchUsers()
}

// Expose methods to parent component
defineExpose({
  refresh
})

onMounted(() => {
  fetchUsers()
})
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
        <ul class="n-users-grid n-users-grid-auto">
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
                @delete="$emit('delete', user)"
              />
            </slot>
          </li>
        </ul>
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

<!-- CSS removed - now consolidated in nuxt-users.css -->
