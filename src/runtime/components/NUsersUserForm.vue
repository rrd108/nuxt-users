<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { RuntimeModuleOptions, User } from 'nuxt-users/utils'
import { usePasswordValidation } from '../composables/usePasswordValidation'
import { useRuntimeConfig } from '#imports'

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
const formData = ref(props.user ?? emptyFormData)

const { public: { nuxtUsers } } = useRuntimeConfig()
const moduleOptions = nuxtUsers as RuntimeModuleOptions
const passwordValidation = usePasswordValidation(moduleOptions)
const nameError = ref('')

const isEditMode = computed(() => !!props.user)
const title = computed(() => isEditMode.value ? 'Edit User' : 'Create User')
const submitText = computed(() => isEditMode.value ? 'Update' : 'Create')

watch(() => props.user, (newUser) => {
  if (newUser) {
    formData.value = { ...newUser }
  }
})

watch(() => formData.value.name, (name) => {
  if (!name || name.trim().length < 3) {
    nameError.value = 'Name must be at least 3 characters long'
  }
  else {
    nameError.value = ''
  }
})

watch(() => formData.value.password, (newPassword) => {
  if (newPassword) {
    passwordValidation.validate(newPassword)
  }
  else {
    passwordValidation.clearValidation()
  }
})

const handleSubmit = async () => {
  const userData: Partial<User> = { ...formData.value }

  // Validate name (minimum 3 characters)
  if (!userData.name || userData.name.trim().length < 3) {
    console.log('name is too short')
    return // Don't submit if name is too short
  }

  // Remove password if empty in edit mode
  if (isEditMode.value && !userData.password) {
    delete userData.password
  }

  // Validate password if provided
  if (userData.password && !passwordValidation.validationResult.value?.isValid) {
    console.log('password validation failed', passwordValidation.validationResult.value)
    return // Don't submit if password validation fails
  }

  try {
    if (isEditMode.value) {
      // Update existing user
      await $fetch(`${nuxtUsers.apiBasePath}/${props.user!.id}`, {
        method: 'PATCH',
        body: userData
      })
    }
    else {
      // Create new user
      await $fetch(nuxtUsers.apiBasePath, {
        method: 'POST',
        body: userData
      })
    }

    emit('submit', userData)
    formData.value = { ...emptyFormData }
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
          v-model="formData.email"
          type="email"
          required
        >
      </div>

      <div class="n-users-form-group">
        <label for="role">Role:</label>
        <input
          v-model="formData.role"
          type="text"
        >
      </div>

      <div class="n-users-form-group">
        <label for="password">
          {{ isEditMode ? 'Password (leave blank to keep current)' : 'Password:' }}
        </label>
        <input
          v-model="formData.password"
          type="password"
          :required="!isEditMode"
        >

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
