<script setup lang="ts">
import { useAuthentication } from '../composables/useAuthentication'

const { user } = useAuthentication()
</script>

<template>
  <div>
    <h2>Profile Information</h2>
    <dl
      v-if="user"
      class="profile-info"
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

<style scoped>
div {
  background-color: var(--color-bg-primary);
  max-width: 42em;
  margin: 0 auto;
  padding: 1em;
  border-top-left-radius: .5em;
  border-top-right-radius: .5em;
}
h2 {
    border-bottom: .1em solid var(--color-border);
}
dl {
  display: grid;
  grid-template-columns: 1fr 5fr;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 1rem;
}
</style>
