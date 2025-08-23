# Composables Development Guide

This guide covers the development of composables in the Nuxt Users module, including important considerations for build-time compatibility and best practices.

## Overview

Composables in the Nuxt Users module provide reactive state management and API interactions. However, there are important considerations when developing composables that will be used in Vue components, especially regarding build-time execution.

## Build-Time Compatibility Issues

### The Problem

When Vue SFC (Single File Component) components are transformed during the module build process, any composables called at the module level (outside of lifecycle hooks) are executed during build time. This can cause issues if the composable uses Nuxt-specific functions like `useState()` when Nuxt is not yet available.

**Error Example:**
```
[Vue Router warn]: uncaught error during route navigation:
ERROR [nuxt] A composable that requires access to the Nuxt instance was called outside of a plugin, Nuxt hook, Nuxt middleware, or Vue setup function.
```

### Root Cause

The error occurs because:
1. Vue SFC components are transformed during the module build process
2. During this transformation, composables that use `useState()` or other Nuxt-specific functions are executed
3. At build time, the Nuxt instance is not available, causing the error

### Which Composables Are Affected

**Composables that use `useState()` (need special handling):**
- `useUsers()` - Uses `useState()` for global state management
- `useAuthentication()` - Uses `useState()` for user state

**Composables that are safe (no special handling needed):**
- `usePasswordValidation()` - Only uses Vue's `ref()` and `computed()`
- `usePublicPaths()` - Only uses `useRuntimeConfig()` (Nuxt-provided)

**Nuxt-provided composables (always safe):**
- `useRuntimeConfig()` - Designed to work during build process
- `useRoute()` - Nuxt-provided
- `useRouter()` - Nuxt-provided

## Solution: Lazy Initialization Pattern

For components that use composables with `useState()`, implement the lazy initialization pattern:

### Before (Problematic)
```vue
<script setup lang="ts">
import { useUsers } from '../composables/useUsers'

// ❌ This causes build-time error
const { users, pagination, loading, error, fetchUsers, removeUser } = useUsers()
</script>
```

### After (Fixed)
```vue
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useUsers } from '../composables/useUsers'

// Initialize the composable state as null initially
let usersComposable: ReturnType<typeof useUsers> | null = null

// Create computed properties that safely access the composable
const users = computed(() => usersComposable?.users.value ?? [])
const pagination = computed(() => usersComposable?.pagination.value ?? null)
const loading = computed(() => usersComposable?.loading.value ?? false)
const error = computed(() => usersComposable?.error.value ?? null)

onMounted(() => {
  // Initialize the composable only after the component is mounted
  usersComposable = useUsers()
  
  // Fetch data if needed
  if (users.value.length === 0) {
    usersComposable.fetchUsers()
  }
})

const handleFetchUsers = (page?: number, limit?: number) => {
  if (usersComposable) {
    usersComposable.fetchUsers(page, limit)
  }
}
</script>
```

## Implementation Guidelines

### 1. Identify Affected Components

Check which components use composables that call `useState()`:

```bash
grep -r "useUsers\|useAuthentication" src/runtime/components/
```

### 2. Apply the Pattern

For each affected component:
1. Move the composable call to `onMounted()`
2. Create computed properties for reactive values
3. Create wrapper functions for methods
4. Add null checks where necessary

### 3. Keep Nuxt-Provided Composables at Module Level

Nuxt-provided composables like `useRuntimeConfig()` should remain at the module level:

```vue
<script setup lang="ts">
// ✅ Safe to keep at module level
const { public: { nuxtUsers } } = useRuntimeConfig()

// ❌ Custom composable with useState needs lazy initialization
let authComposable: ReturnType<typeof useAuthentication> | null = null

onMounted(() => {
  authComposable = useAuthentication()
})
</script>
```

## Testing the Fix

After applying the fix, verify that:

1. **Build succeeds** - No more build-time errors
2. **Components work correctly** - All functionality preserved
3. **Reactivity maintained** - Computed properties update properly
4. **Unit tests pass** - All existing tests continue to work

## Best Practices

### When Developing New Composables

1. **Prefer Vue primitives** - Use `ref()` and `computed()` when possible
2. **Use `useState()` sparingly** - Only when you need global state
3. **Document requirements** - Clearly indicate if a composable uses `useState()`
4. **Test build compatibility** - Ensure composables work in both build and runtime

### When Using Composables in Components

1. **Check the source** - Look at what the composable uses internally
2. **Apply lazy initialization** - For composables using `useState()`
3. **Keep Nuxt composables at module level** - They're designed for it
4. **Test thoroughly** - Ensure both build and runtime work correctly

## Common Patterns

### Pattern 1: Simple State Management
```typescript
// ✅ Safe - only uses Vue primitives
export const useSimpleState = () => {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}
```

### Pattern 2: Global State with useState
```typescript
// ⚠️ Requires lazy initialization in components
export const useGlobalState = () => {
  const state = useState('global', () => ({ count: 0 }))
  const increment = () => state.value.count++
  return { state, increment }
}
```

### Pattern 3: Mixed Usage
```typescript
// ⚠️ Requires lazy initialization due to useState
export const useMixedState = () => {
  const globalState = useState('global', () => ({ count: 0 }))
  const localState = ref({ loading: false })
  
  return { globalState, localState }
}
```

## Troubleshooting

### Build Errors
If you encounter build-time errors:
1. Check which composables are being called at module level
2. Identify which ones use `useState()`
3. Apply the lazy initialization pattern
4. Test the build again

### Runtime Errors
If components don't work after the fix:
1. Ensure computed properties are properly set up
2. Check that null checks are in place
3. Verify that methods are properly wrapped
4. Test the component functionality

## Related Documentation

- [Architecture Guide](./architecture.md) - Overall module architecture
- [Code Style Guide](./code-style.md) - Coding conventions
- [Testing Guide](./testing.md) - Testing strategies
- [User Guide - Composables](../user-guide/composables.md) - How to use composables
