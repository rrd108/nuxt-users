<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { RuntimeModuleOptions, User } from 'nuxt-users/utils'
import { getAvailableRoles, MAX_ROLE_LENGTH } from 'nuxt-users/utils'
import { usePasswordValidation } from '../composables/usePasswordValidation'
import { useNuxtUsersLocale } from '../composables/useNuxtUsersLocale'
import { useRuntimeConfig } from '#imports'

const CUSTOM_ROLE_OPTION = '__custom__'

// Note: We define Props interface inline instead of importing types from 'nuxt-users/utils'
// because the Vue SFC transformer cannot resolve these imported types during the module build process
interface Props {
  user?: User | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'submit', userData: Partial<User>): void
  (e: 'cancel'): void
  (e: 'error', error: unknown): void
}>()

const emptyFormData = {
  name: '',
  email: '',
  role: 'user',
  password: ''
}
const formData = ref(props.user ?? { ...emptyFormData })

const { public: { nuxtUsers } } = useRuntimeConfig()
const moduleOptions = nuxtUsers as RuntimeModuleOptions
const passwordValidation = usePasswordValidation(moduleOptions)
const { t } = useNuxtUsersLocale()
const nameError = ref('')
const roleError = ref('')
const roleSelectValue = ref('')

const isEditMode = computed(() => !!props.user)
const title = computed(() => isEditMode.value ? 'Edit User' : 'Create User')
const submitText = computed(() => isEditMode.value ? 'Update' : 'Create')

const availableRoles = computed(() => getAvailableRoles(moduleOptions.auth?.permissions))
const allowCustomRoles = computed(() => moduleOptions.auth?.allowCustomRoles === true)
const useRoleSelect = computed(() => availableRoles.value.length > 0)

const roleOptions = computed(() => {
  const roles = [...availableRoles.value]
  const currentRole = formData.value.role
  if (currentRole && !roles.includes(currentRole) && currentRole !== CUSTOM_ROLE_OPTION) {
    roles.push(currentRole)
  }
  return roles
})

const isCustomRoleSelected = computed(() => roleSelectValue.value === CUSTOM_ROLE_OPTION)

const syncRoleSelectFromForm = () => {
  if (!useRoleSelect.value) {
    roleSelectValue.value = ''
    return
  }

  const currentRole = formData.value.role || ''
  if (roleOptions.value.includes(currentRole)) {
    roleSelectValue.value = currentRole
    return
  }

  if (allowCustomRoles.value) {
    roleSelectValue.value = CUSTOM_ROLE_OPTION
    return
  }

  roleSelectValue.value = roleOptions.value[0] || 'user'
  formData.value.role = roleSelectValue.value
}

watch(() => props.user, (newUser) => {
  if (newUser) {
    formData.value = { ...newUser }
  }
  if (!newUser) {
    formData.value = { ...emptyFormData }
  }
  syncRoleSelectFromForm()
}, { immediate: true })

watch(() => formData.value.name, (name) => {
  nameError.value = ''
  if (!name || name.trim().length < 3) {
    nameError.value = 'Name must be at least 3 characters long'
  }
})

watch(() => formData.value.password, (newPassword) => {
  if (newPassword) {
    passwordValidation.validate(newPassword)
  }
  if (!newPassword) {
    passwordValidation.clearValidation()
  }
})

watch(roleSelectValue, (value) => {
  roleError.value = ''
  if (!useRoleSelect.value) {
    return
  }
  if (value === CUSTOM_ROLE_OPTION) {
    if (!allowCustomRoles.value) {
      return
    }
    if (roleOptions.value.includes(formData.value.role)) {
      formData.value.role = ''
    }
    return
  }
  formData.value.role = value
})

const validateRole = (): boolean => {
  roleError.value = ''
  const role = (formData.value.role || '').trim()

  if (!role) {
    roleError.value = 'Role is required'
    return false
  }

  if (role.length > MAX_ROLE_LENGTH) {
    roleError.value = `Role must be at most ${MAX_ROLE_LENGTH} characters`
    return false
  }

  if (!useRoleSelect.value) {
    return true
  }

  if (allowCustomRoles.value && isCustomRoleSelected.value) {
    return true
  }

  if (roleOptions.value.includes(role)) {
    return true
  }

  roleError.value = `Invalid role. Allowed roles: ${availableRoles.value.join(', ')}`
  return false
}

const handleSubmit = async () => {
  const userData: Partial<User> = { ...formData.value }

  // Validate name (minimum 3 characters)
  if (!userData.name || userData.name.trim().length < 3) {
    console.log('name is too short')
    return
  }

  if (!validateRole()) {
    return
  }

  userData.role = (userData.role || '').trim()

  // Remove password if empty in edit mode
  if (isEditMode.value && !userData.password) {
    delete userData.password
  }

  // Validate password if provided
  if (userData.password && !passwordValidation.validationResult.value?.isValid) {
    console.log('password validation failed', passwordValidation.validationResult.value)
    return
  }

  try {
    if (isEditMode.value) {
      await $fetch(`${nuxtUsers.apiBasePath}/${props.user!.id}`, {
        method: 'PATCH',
        body: userData
      })
    }
    if (!isEditMode.value) {
      await $fetch(nuxtUsers.apiBasePath, {
        method: 'POST',
        body: userData
      })
    }

    emit('submit', userData)
    formData.value = { ...emptyFormData }
    syncRoleSelectFromForm()
  }
  catch (error) {
    console.error('Failed to save user:', error)
    emit('error', error)
  }
}
</script>

<template>
  <div class="n-users-user-form">
    <h3>{{ title }}</h3>

    <form @submit.prevent="handleSubmit">
      <div class="n-users-form-group">
        <label for="name">Name:</label>
        <input
          id="name"
          v-model="formData.name"
          name="name"
          type="text"
          minlength="3"
          required
          :class="{ error: nameError }"
        >
        <small
          v-if="nameError"
          class="n-users-error-text"
        >
          {{ nameError }}
        </small>
      </div>

      <div class="n-users-form-group">
        <label for="email">Email:</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          required
        >
      </div>

      <div class="n-users-form-group">
        <label for="role">Role:</label>

        <template v-if="useRoleSelect">
          <select
            id="role"
            v-model="roleSelectValue"
            name="role"
            required
            :class="{ error: roleError }"
          >
            <option
              v-for="role in roleOptions"
              :key="role"
              :value="role"
            >
              {{ role }}
            </option>
            <option
              v-if="allowCustomRoles"
              :value="CUSTOM_ROLE_OPTION"
            >
              {{ t('userForm.customRoleOption') }}
            </option>
          </select>

          <input
            v-if="allowCustomRoles && isCustomRoleSelected"
            id="custom-role"
            v-model="formData.role"
            type="text"
            name="custom-role"
            :maxlength="MAX_ROLE_LENGTH"
            required
            :placeholder="t('userForm.customRolePlaceholder')"
            :class="{ error: roleError }"
          >
        </template>

        <input
          v-else
          id="role"
          v-model="formData.role"
          type="text"
          name="role"
          :maxlength="MAX_ROLE_LENGTH"
          required
          :class="{ error: roleError }"
        >

        <small
          v-if="roleError"
          class="n-users-error-text"
        >
          {{ roleError }}
        </small>
      </div>

      <div class="n-users-form-group">
        <label for="password">
          {{ isEditMode ? 'Password (leave blank to keep current)' : 'Password:' }}
        </label>
        <NUsersPasswordInput
          id="password"
          v-model="formData.password"
          name="password"
          :required="!isEditMode"
          autocomplete="new-password"
        />

        <NUsersPasswordStrengthIndicator
          :password="formData.password"
          :validation-result="passwordValidation.validationResult.value"
        />
      </div>

      <div class="n-users-form-actions">
        <button
          type="submit"
          class="n-users-submit-btn"
        >
          {{ submitText }}
        </button>
      </div>
    </form>
  </div>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
