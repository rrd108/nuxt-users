<script setup lang="ts">
import { useAuthentication } from '../composables/useAuthentication'

const { user } = useAuthentication()
</script>

<template>
  <div class="n-users-profile-info n-users-section">
    <h2 class="n-users-section-header">
      Profile Information
    </h2>
    <dl
      v-if="user"
      class="n-users-profile-details n-users-grid n-users-grid-2"
    >
      <dt>Name:</dt>
      <dd>{{ user.name }}</dd>

      <dt>Email:</dt>
      <dd>{{ user.email }}</dd>

      <dt>Role:</dt>
      <dd>{{ user.role }}</dd>

      <dt>Registered:</dt>
      <dd>{{ Intl.DateTimeFormat().format(new Date(user.created_at)) }}</dd>

      <dt>Last updated:</dt>
      <dd>{{ Intl.DateTimeFormat().format(new Date(user.updated_at)) }}</dd>
    </dl>
  </div>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
