<template>
  <form action="/api/auth/google" method="post">
    <button type="submit">
      <slot>Login with Google</slot>
    </button>
  </form>
</template>
