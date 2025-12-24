<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthentication } from '../composables/useAuthentication'
import { useNuxtUsersLocale } from '../composables/useNuxtUsersLocale'

const { t } = useNuxtUsersLocale()

interface Props {
  title?: string
  nameLabel?: string
  emailLabel?: string
  roleLabel?: string
  registeredLabel?: string
  lastUpdatedLabel?: string
  activeLabel?: string
  idLabel?: string
  yesText?: string
  noText?: string
}

const props = defineProps<Props>()

// Initialize the composable state as null initially
const authComposable = ref<ReturnType<typeof useAuthentication> | null>(null)

// Create computed property that safely accesses the composable
const user = computed(() => authComposable.value?.user ?? null)

onMounted(() => {
  // Initialize the composable only after the component is mounted
  authComposable.value = useAuthentication()
})
</script>

<template>
  <div class="n-users-profile-info n-users-section">
    <h2 class="n-users-section-header">
      {{ props.title || t('profile.title') }}
    </h2>
    <dl
      v-if="user"
      class="n-users-profile-details n-users-grid n-users-grid-2"
    >
      <dt>{{ props.nameLabel || t('profile.name') }}</dt>
      <dd>{{ user.name }}</dd>

      <dt>{{ props.emailLabel || t('profile.email') }}</dt>
      <dd>{{ user.email }}</dd>

      <dt>{{ props.roleLabel || t('profile.role') }}</dt>
      <dd>{{ user.role }}</dd>

      <dt>{{ props.registeredLabel || t('profile.registered') }}</dt>
      <dd>{{ Intl.DateTimeFormat().format(new Date(user.created_at)) }}</dd>

      <dt>{{ props.lastUpdatedLabel || t('profile.lastUpdated') }}</dt>
      <dd>{{ Intl.DateTimeFormat().format(new Date(user.updated_at)) }}</dd>

      <dt>{{ props.activeLabel || t('profile.active') }}</dt>
      <dd>{{ user.active ? (props.yesText || t('common.yes')) : (props.noText || t('common.no')) }}</dd>

      <dt>{{ props.idLabel || t('profile.id') }}</dt>
      <dd>{{ user.id }}</dd>
    </dl>
  </div>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
