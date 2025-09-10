<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useUsers } from '../composables/useUsers'
import { defaultDisplayFields, defaultFieldLabels, type User } from 'nuxt-users/utils'

// Note: We define Props interface inline instead of importing DisplayFieldsProps from 'nuxt-users/utils'
// because the Vue SFC transformer cannot resolve these imported types during the module build process
interface Props {
  displayFields?: string[]
  fieldLabels?: Record<string, string>
  filter?: Partial<User>
}

const props = withDefaults(defineProps<Props>(), {
  displayFields: () => defaultDisplayFields,
  fieldLabels: () => defaultFieldLabels,
  filter: () => ({})
})

const emit = defineEmits<{
  (e: 'editClick' | 'delete', user: User): void
}>()

// Initialize the composable state as null initially
const usersComposable = ref<ReturnType<typeof useUsers> | null>(null)

// Create computed properties that safely access the composable
const allUsers = computed(() => usersComposable.value?.users ?? [])
const pagination = computed(() => usersComposable.value?.pagination ?? null)
const loading = computed(() => usersComposable.value?.loading ?? false)
const error = computed(() => usersComposable.value?.error ?? null)

// Filter users based on the filter prop
const users = computed(() => {
  if (!props.filter || Object.keys(props.filter).length === 0) {
    return allUsers.value
  }

  return allUsers.value.filter((user) => {
    return Object.entries(props.filter).every(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return true
      }

      const userValue = user[key as keyof User]

      // Handle string matching (case-insensitive for string fields)
      if (typeof value === 'string' && typeof userValue === 'string') {
        return userValue.toLowerCase().includes(value.toLowerCase())
      }

      // Handle exact matching for other types
      return userValue === value
    })
  })
})

onMounted(async () => {
  // Initialize the composable only after the component is mounted
  usersComposable.value = useUsers()

  // Fetch users only if the list is empty to avoid unnecessary fetches
  if (allUsers.value.length === 0) {
    usersComposable.value?.fetchUsers()
  }
})

const handleDelete = (user: User) => {
  if (usersComposable.value) {
    usersComposable.value?.removeUser(user.id)
  }
  emit('delete', user)
}

const handleFetchUsers = (page?: number, limit?: number) => {
  if (usersComposable.value) {
    usersComposable.value.fetchUsers(page, limit)
  }
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
            <div class="n-users-user-wrapper">
              <slot
                name="user"
                :user="user"
                :index="index"
                :edit-user="() => $emit('editClick', user)"
                :delete-user="() => handleDelete(user)"
              >
                <NUsersUserCard
                  :user="user"
                  :index="index"
                  :display-fields="displayFields"
                  :field-labels="fieldLabels"
                  @edit-click="$emit('editClick', user)"
                  @delete="handleDelete(user)"
                >
                  <template #editButton="{ canEdit, editUser: editUserFn, user: userData }">
                    <slot
                      name="editButton"
                      :can-edit="canEdit"
                      :edit-user="editUserFn"
                      :user="userData"
                    >
                      <button
                        v-if="canEdit"
                        class="n-users-edit-btn"
                        @click="editUserFn"
                      >
                        Edit
                      </button>
                    </slot>
                  </template>
                  <template #deleteButton="{ canDelete, deleteUser: deleteUserFn, user: userData }">
                    <slot
                      name="deleteButton"
                      :can-delete="canDelete"
                      :delete-user="deleteUserFn"
                      :user="userData"
                    >
                      <button
                        v-if="canDelete"
                        class="n-users-delete-btn"
                        @click="deleteUserFn"
                      >
                        Delete
                      </button>
                    </slot>
                  </template>
                </NUsersUserCard>
              </slot>

              <!-- Always show action buttons when using custom user slot -->
              <div
                v-if="$slots.user"
                class="n-users-user-card-actions"
              >
                <NUsersUserCard
                  :user="user"
                  :index="index"
                  :display-fields="[]"
                  :field-labels="{}"
                  @edit-click="$emit('editClick', user)"
                  @delete="handleDelete(user)"
                >
                  <template #userCard>
                    <!-- Empty slot to hide the default card content -->
                  </template>
                  <template #editButton="{ canEdit, editUser: editUserFn, user: userData }">
                    <slot
                      name="editButton"
                      :can-edit="canEdit"
                      :edit-user="editUserFn"
                      :user="userData"
                    >
                      <button
                        v-if="canEdit"
                        class="n-users-edit-btn"
                        @click="editUserFn"
                      >
                        Edit
                      </button>
                    </slot>
                  </template>
                  <template #deleteButton="{ canDelete, deleteUser: deleteUserFn, user: userData }">
                    <slot
                      name="deleteButton"
                      :can-delete="canDelete"
                      :delete-user="deleteUserFn"
                      :user="userData"
                    >
                      <button
                        v-if="canDelete"
                        class="n-users-delete-btn"
                        @click="deleteUserFn"
                      >
                        Delete
                      </button>
                    </slot>
                  </template>
                </NUsersUserCard>
              </div>
            </div>
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
        :fetch-users="handleFetchUsers"
        :loading="loading"
      >
        <div v-if="pagination && pagination.totalPages > 1">
          <div>
            <button
              v-if="pagination.hasPrev"
              :disabled="loading"
              @click="handleFetchUsers(pagination.page - 1)"
            >
              Previous
            </button>

            <button
              v-if="pagination.hasNext"
              :disabled="loading"
              @click="handleFetchUsers(pagination.page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>
