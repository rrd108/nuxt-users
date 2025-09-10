<script setup lang="ts">
</script>

<template>
  <NUsersList>
    <template #user="{ user }">
      <div>
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
        <p>{{ user.role }}</p>
      </div>
    </template>
  </NUsersList>
</template>

<style scoped>
</style>
