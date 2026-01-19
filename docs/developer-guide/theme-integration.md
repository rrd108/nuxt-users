# Theme Integration Guide

This guide explains how to integrate the nuxt-users module's theme system with your application's existing theme management.

> **✨ TL;DR for Nuxt UI Users**: If you're using [Nuxt UI](https://ui.nuxt.com), it just works! No configuration needed. Jump to the [Nuxt UI Integration](#nuxt-ui-integration) section for examples.

## Overview

The nuxt-users module includes a flexible theme system that:

- **Automatically adapts** to system color scheme preferences
- **Detects and respects** consumer app theme changes
- **Provides composables** for programmatic control
- **Works seamlessly** with existing theme systems
- **Can be disabled** if you want complete control

## How Theme Detection Works

The module uses a hybrid detection system with multiple layers:

### 1. System Preference Detection

Listens to OS-level dark mode changes via `window.matchMedia('(prefers-color-scheme: dark)')`:

```typescript
// Automatically applied when theme is set to 'system' (default)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  // Module updates automatically
})
```

### 2. DOM Class Observation

Uses `MutationObserver` to detect when your app adds/removes the `dark` class:

```typescript
// Your app code
document.documentElement.classList.toggle('dark')
// Module detects this change and syncs its state
```

### 3. Custom Event Listening

Listens for events dispatched by your app:

```typescript
// Your app dispatches
window.dispatchEvent(new CustomEvent('theme-change', {
  detail: { theme: 'dark' }
}))
// Module receives and applies the theme
```

### 4. Shared State Composable

Provides a composable that both your app and the module can use:

```typescript
const { theme, setTheme } = useTheme()
setTheme('dark') // Both app and module stay in sync
```

## Nuxt UI Integration

The nuxt-users module works seamlessly with [Nuxt UI](https://ui.nuxt.com) and [@nuxtjs/color-mode](https://color-mode.nuxtjs.org) out of the box.

### How It Works

Nuxt UI uses `@nuxtjs/color-mode` which adds/removes the `dark` class on `document.documentElement`. The nuxt-users module detects this automatically via `MutationObserver` and all components adapt instantly.

### Basic Usage (Recommended)

Simply use both modules together - no configuration needed:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', 'nuxt-users']
  // That's it! Both work together automatically
})
```

```vue
<!-- app.vue -->
<script setup>
const colorMode = useColorMode() // Nuxt UI's composable

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(isDark) {
    colorMode.preference = isDark ? 'dark' : 'light'
  }
})
</script>

<template>
  <div>
    <header>
      <!-- Nuxt UI's color mode button -->
      <ClientOnly v-if="!colorMode?.forced">
        <UButton
          :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
          color="neutral"
          variant="ghost"
          @click="isDark = !isDark"
        />
      </ClientOnly>
    </header>
    
    <main>
      <!-- Mix Nuxt UI and nuxt-users components -->
      <UCard>
        <NUsersLoginForm />
        <!-- Both follow the same theme automatically! -->
      </UCard>
    </main>
  </div>
</template>
```

### Bidirectional Sync (Optional)

If you want both composables in perfect sync:

```vue
<script setup>
const colorMode = useColorMode()
const { theme: nuxtUsersTheme, setTheme } = useTheme()

// Sync nuxt-users with @nuxtjs/color-mode
watch(() => colorMode.preference, (newMode) => {
  if (newMode === 'dark' || newMode === 'light') {
    setTheme(newMode)
  }
  if (newMode === 'system') {
    setTheme('system')
  }
}, { immediate: true })

// Optionally sync back (if nuxt-users controls theme)
watch(nuxtUsersTheme, (newTheme) => {
  if (newTheme !== 'system') {
    colorMode.preference = newTheme
  }
})
</script>

<template>
  <div>
    <!-- Both systems perfectly synchronized -->
    <UCard>
      <NUsersLoginForm />
    </UCard>
  </div>
</template>
```

### Testing the Integration

Verify both systems are in sync:

```vue
<script setup>
const colorMode = useColorMode()
const { resolvedTheme } = useTheme()

watchEffect(() => {
  console.log('Nuxt UI:', colorMode.value)
  console.log('nuxt-users:', resolvedTheme.value)
  // These will always match!
})
</script>

<template>
  <UCard>
    <p>Nuxt UI theme: {{ colorMode.value }}</p>
    <p>nuxt-users theme: {{ resolvedTheme }}</p>
  </UCard>
</template>
```

### Using Nuxt UI's Color Mode Components

All of Nuxt UI's theme components work perfectly with nuxt-users:

```vue
<template>
  <div>
    <!-- Use any Nuxt UI color mode component -->
    <ColorModeButton />
    <!-- or -->
    <ColorModeSwitch />
    <!-- or -->
    <ColorModeSelect />
    
    <!-- nuxt-users components adapt automatically -->
    <NUsersLoginForm />
    <NUsersUserMenu />
  </div>
</template>
```

### Why It Works

Both systems follow the same conventions:
- ✅ Both use the `dark` class on `<html>` element
- ✅ Both use CSS custom properties for theming
- ✅ No JavaScript conflicts
- ✅ Single source of truth (`@nuxtjs/color-mode`)

**Result**: Perfect compatibility with zero configuration! 🎉

---

## Integration Patterns

### Pattern 1: Let the Module Handle Everything

The simplest approach - no integration needed:

```vue
<!-- App.vue -->
<template>
  <div>
    <NUsersLoginForm />
    <!-- Components automatically follow system preferences -->
  </div>
</template>
```

**When to use**: New projects without existing theme systems.

---

### Pattern 2: Use the Module's Composable

Share the theme state between your app and the module:

```vue
<!-- App.vue -->
<script setup>
const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()

const themeIcon = computed(() => {
  return resolvedTheme.value === 'dark' ? '🌙' : '☀️'
})
</script>

<template>
  <div>
    <header>
      <button @click="toggleTheme" :title="`Current: ${resolvedTheme}`">
        {{ themeIcon }}
      </button>
    </header>
    
    <main>
      <NUsersLoginForm />
    </main>
  </div>
</template>
```

**When to use**: You want a simple theme toggle and don't have complex theme requirements.

---

### Pattern 3: Your App Controls, Module Follows

Your app manages themes, module components adapt automatically:

```vue
<!-- App.vue -->
<script setup>
// Your existing theme system (e.g., @nuxtjs/color-mode)
const colorMode = useColorMode()

// @nuxtjs/color-mode automatically manages the 'dark' class
// Module's MutationObserver detects this and adapts automatically!
</script>

<template>
  <div>
    <NUsersLoginForm />
    <!-- Automatically follows your theme changes -->
  </div>
</template>
```

**When to use**: Existing app with established theme system (like Nuxt UI with `@nuxtjs/color-mode`).

---

### Pattern 4: Explicit Communication via Events

Your app notifies the module about theme changes:

```vue
<!-- App.vue -->
<script setup>
const currentTheme = ref('light')

const changeTheme = (newTheme: 'light' | 'dark') => {
  currentTheme.value = newTheme
  
  // Update DOM
  document.documentElement.classList.toggle('dark', newTheme === 'dark')
  
  // Notify module explicitly
  window.dispatchEvent(new CustomEvent('theme-change', {
    detail: { theme: newTheme }
  }))
}

// Or listen to module's events
window.addEventListener('nuxt-users:theme-change', (event) => {
  console.log('Module changed theme to:', event.detail.resolved)
  // Sync your app state if needed
  currentTheme.value = event.detail.resolved
})
</script>

<template>
  <div>
    <button @click="changeTheme('dark')">Dark</button>
    <button @click="changeTheme('light')">Light</button>
    <NUsersLoginForm />
  </div>
</template>
```

**When to use**: You want explicit control and clear event-driven communication.

---

### Pattern 5: Disable Module's Theme Plugin

Complete control - module doesn't manage themes at all:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-users'],
  nuxtUsers: {
    theme: {
      enabled: false
    }
  }
})
```

```vue
<!-- App.vue -->
<script setup>
// Your complete theme management
const isDark = useDark()

watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
})
</script>

<template>
  <div>
    <NUsersLoginForm />
    <!-- Components use CSS only, no JS theme management -->
  </div>
</template>
```

**When to use**: You have a complex theme system and want zero interference.

## Advanced Use Cases

### Multiple Theme Variants

Combine dark/light mode with color variants when using Nuxt UI:

```vue
<script setup>
const themeVariant = ref<'blue' | 'green' | 'purple'>('blue')
const { resolvedTheme } = useTheme()

const themeClasses = computed(() => [
  resolvedTheme.value === 'dark' ? 'dark' : '',
  `theme-${themeVariant.value}`
])
</script>

<template>
  <div :class="themeClasses">
    <NUsersLoginForm />
  </div>
</template>

<style>
/* Override module colors per variant */
.theme-blue {
  --nu-color-primary: #3b82f6;
  --nu-color-primary-dark: #2563eb;
}

.theme-green {
  --nu-color-primary: #10b981;
  --nu-color-primary-dark: #059669;
}

.theme-purple {
  --nu-color-primary: #8b5cf6;
  --nu-color-primary-dark: #7c3aed;
}
</style>
```

### Per-Component Theme Override

```vue
<template>
  <!-- Main app follows system theme -->
  <div>
    <header>
      <NUsersUserMenu />
    </header>
    
    <!-- Force light theme for this section only -->
    <aside class="light sidebar">
      <NUsersUserList />
    </aside>
    
    <main>
      <NUsersLoginForm />
    </main>
  </div>
</template>
```

### SSR Considerations

The theme plugin only runs on the client side. For SSR, you can:

```vue
<script setup>
const { resolvedTheme } = useTheme()

// On client, will be reactive
// On server, will be 'light' (default)
</script>

<template>
  <div :class="{ dark: resolvedTheme === 'dark' }">
    <NUsersLoginForm />
  </div>
</template>
```

Or use the `ClientOnly` component:

```vue
<template>
  <div>
    <ClientOnly>
      <template #default>
        <ThemeToggle />
      </template>
      <template #fallback>
        <!-- Shown during SSR -->
        <div>Loading theme...</div>
      </template>
    </ClientOnly>
    
    <NUsersLoginForm />
  </div>
</template>
```

## API Reference

### `useTheme()` Composable

```typescript
interface UseThemeReturn {
  // Current theme mode ('light' | 'dark' | 'system')
  theme: Ref<ThemeMode>
  
  // Resolved theme ('light' | 'dark')
  // If theme is 'system', this shows the actual resolved value
  resolvedTheme: Ref<'light' | 'dark'>
  
  // Set theme programmatically
  setTheme: (mode: ThemeMode) => void
  
  // Toggle between light and dark
  toggleTheme: () => void
}
```

### Module Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nuxtUsers: {
    theme: {
      // Enable/disable automatic theme plugin
      enabled: boolean // default: true
    }
  }
})
```

### Events

**Listening to module theme changes:**

```typescript
window.addEventListener('nuxt-users:theme-change', (event: CustomEvent) => {
  console.log(event.detail.mode)      // 'light' | 'dark' | 'system'
  console.log(event.detail.resolved)  // 'light' | 'dark'
})
```

**Notifying module of your theme changes:**

```typescript
window.dispatchEvent(new CustomEvent('theme-change', {
  detail: { theme: 'dark' }
}))

// Or
window.dispatchEvent(new CustomEvent('color-scheme-change', {
  detail: { colorScheme: 'dark' }
}))
```

## Best Practices

1. **Start Simple**: Use the default behavior first. Only add complexity if needed.

2. **Choose One Pattern**: Pick one integration pattern and stick with it to avoid conflicts.

3. **Test Both Themes**: Always test your components in both light and dark modes.

4. **Respect User Preference**: If using system preference, provide a way to override it.

5. **Avoid Fighting**: Don't have multiple systems trying to control the same `dark` class.

6. **Use CSS Variables**: Override `--nu-*` CSS custom properties for theming, not component styles directly.

7. **Document Your Choice**: Make it clear in your codebase which pattern you're using.

## Troubleshooting

### Components not responding to theme changes

**Issue**: Module components stay in light mode even when your app is dark.

**Solution**: Ensure the `dark` class is on `document.documentElement` (the `<html>` tag), not `<body>`.

```javascript
// ✅ Correct
document.documentElement.classList.add('dark')

// ❌ Wrong
document.body.classList.add('dark')
```

---

### Theme flickering on page load

**Issue**: Components flash light theme before switching to dark.

**Solution**: Set theme as early as possible, ideally in a blocking script:

```vue
<!-- app.vue -->
<script setup>
// Set theme before hydration
onBeforeMount(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  }
})
</script>
```

Or use a plugin with higher priority.

---

### Multiple systems conflicting

**Issue**: Your theme toggle and the module's system are fighting.

**Solution**: Disable the module's theme plugin:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nuxtUsers: {
    theme: { enabled: false }
  }
})
```

---

### Module not detecting your theme changes

**Issue**: You change the theme, but module doesn't adapt.

**Solution**: Ensure you're either:
1. Adding/removing the `dark` class on `document.documentElement`, OR
2. Dispatching a `theme-change` event, OR
3. Using the `useTheme()` composable

## Examples Repository

Complete working examples are available in the module's playground:

- **Basic theme toggle**: `playground/pages/theme-basic.vue`
- **Integration with color-mode**: `playground/pages/theme-color-mode.vue`
- **Custom theme system**: `playground/pages/theme-custom.vue`
- **Disabled plugin**: `playground/pages/theme-disabled.vue`

## Need Help?

If you're having issues with theme integration:

1. Check this guide for your use case
2. Look at the playground examples
3. Open an issue on GitHub with your setup details
