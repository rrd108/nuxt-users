<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthentication } from '../composables/useAuthentication'
import { useRuntimeConfig } from '#imports'
import { defaultDisplayFields, defaultFieldLabels, type User, type Permission } from 'nuxt-users/utils'
import { useNuxtUsersLocale } from '../composables/useNuxtUsersLocale'

const { t } = useNuxtUsersLocale()

// Note: We define Props interface inline instead of importing DisplayFieldsProps from 'nuxt-users/utils'
// because the Vue SFC transformer cannot resolve these imported types during the module build process
interface Props {
  user: User
  index: number
  displayFields?: string[]
  fieldLabels?: Record<string, string>
  editButtonText?: string
  deleteButtonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  displayFields: () => defaultDisplayFields,
  fieldLabels: () => defaultFieldLabels,
})

const emit = defineEmits<{
  (e: 'delete' | 'editClick', user: User): void
}>()

const { public: { nuxtUsers } } = useRuntimeConfig()

// Initialize the composable state as null initially to avoid build-time issues
const authComposable = ref<ReturnType<typeof useAuthentication> | null>(null)

// Create computed property that safely accesses the composable
const currentUser = computed(() => authComposable.value?.user ?? null)

onMounted(async () => {
  // Initialize the composable only after the component is mounted
  authComposable.value = useAuthentication()
})

const canEdit = computed(() => {
  if (!currentUser.value) return false

  // Check custom permissions if configured
  if (nuxtUsers.auth?.permissions) {
    const userPermissions = (nuxtUsers.auth.permissions[currentUser.value.role as keyof typeof nuxtUsers.auth.permissions] || []) as (string | Permission)[]
    const apiBasePath = nuxtUsers.apiBasePath

    return userPermissions.some((permission: Permission) => {
      if (typeof permission === 'string') {
        return permission === '*'
          || permission === `${apiBasePath}/*`
          || permission === `${apiBasePath}/[id].put`
          || permission === `${apiBasePath}/[id].patch`
      }
      const pathMatches = permission.path === '*'
        || permission.path === `${apiBasePath}/*`
        || permission.path === `${apiBasePath}/[id].put`
        || permission.path === `${apiBasePath}/[id].patch`
      if (!pathMatches) {
        return false
      }
      return permission.methods.some(method => method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')
    })
  }
  return false
})
const canDelete = computed(() => {
  if (!currentUser.value) return false

  // Check custom permissions if configured
  if (nuxtUsers.auth?.permissions) {
    const userPermissions = (nuxtUsers.auth.permissions[currentUser.value.role as keyof typeof nuxtUsers.auth.permissions] || []) as (string | Permission)[]
    const apiBasePath = nuxtUsers.apiBasePath

    return userPermissions.some((permission: Permission) => {
      if (typeof permission === 'string') {
        return permission === '*'
          || permission === `${apiBasePath}/*`
          || permission === `${apiBasePath}/[id].delete`
      }
      const pathMatches = permission.path === '*'
        || permission.path === `${apiBasePath}/*`
        || permission.path === `${apiBasePath}/[id].delete`
      if (!pathMatches) {
        return false
      }
      return permission.methods.some(method => method.toUpperCase() === 'DELETE')
    })
  }
  return false
})

const editUser = async (user: User) => {
  console.info('The edit event is emitted. Nuxt-users does not automatically calls the API to update the user, you should do it at the upper component.')
  emit('editClick', user)
}

const deleteUser = async (user: User) => {
  if (!confirm(t('userCard.deleteConfirm', [user.name]))) {
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
      <slot
        name="editButton"
        :can-edit="canEdit"
        :edit-user="() => editUser(user)"
        :user="user"
      >
        <button
          v-if="canEdit"
          class="n-users-edit-btn"
          @click="editUser(user)"
        >
          {{ props.editButtonText || t('userCard.editButton') }}
        </button>
      </slot>
      <slot
        name="deleteButton"
        :can-delete="canDelete"
        :delete-user="() => deleteUser(user)"
        :user="user"
      >
        <button
          v-if="canDelete"
          class="n-users-delete-btn"
          @click="deleteUser(user)"
        >
          {{ props.deleteButtonText || t('userCard.deleteButton') }}
        </button>
      </slot>
    </div>
  </slot>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
