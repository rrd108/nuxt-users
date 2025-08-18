<script setup lang="ts">
import { computed } from 'vue'
import { useAuthentication } from '../composables/useAuthentication'
import { useRuntimeConfig } from '#imports'
import { defaultDisplayFields, defaultFieldLabels, type DisplayFieldsProps, type User } from "nuxt-users/utils"

interface Props extends DisplayFieldsProps {
  user: User
  index: number
}

const props = withDefaults(defineProps<Props>(), {
  displayFields: () => defaultDisplayFields,
  fieldLabels: () => defaultFieldLabels,
})

const emit = defineEmits<{
  (e: 'delete' | 'editClick', user: User): void
}>()

const { user: currentUser } = useAuthentication()
const { public: { nuxtUsers } } = useRuntimeConfig()

const canEdit = computed(() => {
  if (!currentUser.value) return false

  // Check custom permissions if configured
  if (nuxtUsers.auth?.permissions) {
    const userPermissions = nuxtUsers.auth.permissions[currentUser.value.role] || []
    const apiBasePath = nuxtUsers.apiBasePath

    return userPermissions.some((permission: string) =>
      permission === '*'
      || permission === `${apiBasePath}/*`
      || permission === `${apiBasePath}/[id].delete`
    )
  }

  return false
})
const canDelete = computed(() => {
  if (!currentUser.value) return false

  // Check custom permissions if configured
  if (nuxtUsers.auth?.permissions) {
    const userPermissions = nuxtUsers.auth.permissions[currentUser.value.role] || []
    const apiBasePath = nuxtUsers.apiBasePath

    return userPermissions.some((permission: string) =>
      permission === '*'
      || permission === `${apiBasePath}/*`
      || permission === `${apiBasePath}/[id].delete`
    )
  }

  return false
})

const editUser = async (user: User) => {
  emit('editClick', user)
}

const deleteUser = async (user: User) => {
  if (!confirm(`Are you sure you want to delete user ${user.name}?`)) {
    return
  }

  try {
    await $fetch(`${nuxtUsers.apiBasePath}/${user.id}`, { method: 'DELETE' })
    console.log(`User ${user.name} deleted successfully`)
    emit('delete', user)
  }
  catch (error) {
    console.error('Failed to delete user:', error)
  }
}
</script>

<template>
  <slot
    name="userCard"
    :user="user"
    :index="index"
  >
    <dl class="n-users-user-card n-users-grid n-users-grid-2">
      <template
        v-for="field in props.displayFields"
        :key="field"
      >
        <dt>{{ props.fieldLabels[field] || field }}:</dt>
        <dd>{{ user[field as keyof User] }}</dd>
      </template>
    </dl>

    <div
      class="n-users-user-card-actions"
    >
      <button
        v-if="canEdit"
        class="n-users-edit-btn"
        @click="editUser(user)"
      >
        <slot name="editButton">
          Edit
        </slot>
      </button>
      <button
        v-if="canDelete"
        class="n-users-delete-btn"
        @click="deleteUser(user)"
      >
        <slot name="deleteButton">
          Delete
        </slot>
      </button>
    </div>
  </slot>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
