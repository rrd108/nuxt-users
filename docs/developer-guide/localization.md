# Localization Development

This guide explains how to work with localization in Nuxt Users development, including adding new translations, testing, and quality assurance.

## Development Scripts

The module includes two automated checking scripts to maintain translation quality:

### `check:translations`

Scans Vue files for hardcoded strings that should use the `t()` translation function.

```bash
yarn check:translations
```

**What it checks:**
- Template strings in Vue components
- Detects user-facing text that isn't translated
- Filters out technical strings (CSS classes, SVG paths, etc.)

**Example output:**
```
[Nuxt Users] 🔍 Scanning Vue files in: src/runtime/components

[Nuxt Users] 📄 Found 11 Vue file(s)

[Nuxt Users] ⚠️  Found 1 potential hardcoded string(s):

📁 src/runtime/components/NUsersResetPasswordForm.vue
   Line 11:9
   String: "You are resetting your password..."
   Context: <p>You are resetting your password...</p>

[Nuxt Users] 💡 Tip: Replace hardcoded strings with t() function
```

### `check:locale-consistency`

Ensures Hungarian formal and informal translation overrides are kept in sync.

```bash
yarn check:locale-consistency
```

**What it checks:**
- All formal variant keys have informal equivalents
- All informal variant keys have formal equivalents
- Reports mismatches with statistics

**Example output:**
```
[Nuxt Users] 🔍 Checking Hungarian locale formal/informal consistency...

[Nuxt Users] 📊 Statistics:
   Base keys: 85
   Informal override keys: 20
   Formal override keys: 20

[Nuxt Users] ✅ All formal/informal translations are consistent!
```

Both scripts run automatically during the release process.

## File Structure

```
src/runtime/
├── locales/
│   ├── index.ts        # Exports all locales
│   ├── en.ts           # English translations
│   └── hu.ts           # Hungarian translations (informal + formal)
├── utils/
│   └── locale.ts       # Translation utilities
└── composables/
    └── useNuxtUsersLocale.ts  # Composable for translations
```

## Adding a New Language

### 1. Create Locale File

Create a new file in `src/runtime/locales/`:

```typescript
// src/runtime/locales/de.ts
import type { LocaleMessages } from '../../types'

export const de: LocaleMessages = {
  common: {
    email: 'E-Mail',
    password: 'Passwort',
    name: 'Name',
    // ... all common keys
  },
  login: {
    title: 'Willkommen zurück',
    subtitle: 'Melden Sie sich an',
    // ... all login keys
  },
  // ... all other sections
}
```

### 2. Export from Index

Add your locale to `src/runtime/locales/index.ts`:

```typescript
import { en } from './en'
import { hu, huFormal } from './hu'
import { de } from './de'  // Add this

export const defaultLocaleMessages: Record<string, LocaleMessages> = {
  en,
  hu,
  'hu-formal': huFormal,
  de  // Add this
}
```

### 3. Test Your Translation

Create an integration test:

```typescript
// test/integration/locale-de.test.ts
import { describe, it, expect } from 'vitest'
import { getTranslation } from '../../src/runtime/utils/locale'

describe('German Locale', () => {
  it('should translate login strings', () => {
    expect(getTranslation('login.title', 'de')).toBe('Willkommen zurück')
    expect(getTranslation('login.submit', 'de')).toBe('Anmelden')
  })
  
  it('should have all required keys', () => {
    const keys = [
      'login.title',
      'login.subtitle',
      'register.title',
      'resetPassword.titleReset'
      // ... test key translations exist
    ]
    
    keys.forEach(key => {
      const translation = getTranslation(key, 'de')
      expect(translation).not.toBe(key)  // Should not return key itself
    })
  })
})
```

### 4. Run Quality Checks

```bash
# Check for hardcoded strings
yarn check:translations

# Run tests
yarn test:unit test/integration/locale-de.test.ts
```

## Adding Translation Keys

When adding new features that require translations:

### 1. Add to English (Base)

Always start with English in `src/runtime/locales/en.ts`:

```typescript
export const en: LocaleMessages = {
  // ... existing keys
  myNewFeature: {
    title: 'My New Feature',
    description: 'This is a new feature',
    action: 'Do Something'
  }
}
```

### 2. Add to All Other Locales

Add equivalent keys to all supported locales:

```typescript
// src/runtime/locales/hu.ts
const huBase: LocaleMessages = {
  // ... existing keys
  myNewFeature: {
    title: 'Új Funkció',
    description: 'Ez egy új funkció',
    action: 'Csinálj Valamit'
  }
}
```

### 3. Add Tests

Test the new translations:

```typescript
it('should translate myNewFeature keys', () => {
  expect(getTranslation('myNewFeature.title', 'en')).toBe('My New Feature')
  expect(getTranslation('myNewFeature.title', 'hu')).toBe('Új Funkció')
})
```

### 4. Use in Components

```vue
<script setup>
const { t } = useNuxtUsersLocale()
</script>

<template>
  <div>
    <h2>{{ t('myNewFeature.title') }}</h2>
    <p>{{ t('myNewFeature.description') }}</p>
    <button>{{ t('myNewFeature.action') }}</button>
  </div>
</template>
```

## Hungarian Formal/Informal Variants

Hungarian has two politeness levels that must be maintained:

### Base (Shared)

Common, non-contextual terms go in `huBase`:

```typescript
const huBase: LocaleMessages = {
  common: {
    email: 'E-mail',      // Same in both variants
    password: 'Jelszó',   // Same in both variants
    name: 'Név'           // Same in both variants
  }
}
```

### Informal Overrides

Personal, casual terms for the `hu` locale:

```typescript
const huInformalOverrides: LocaleMessages = {
  login: {
    rememberMe: 'Emlékezz rám',           // "you" informal
    forgotPassword: 'Elfelejtetted...?'   // "you" informal
  }
}
```

### Formal Overrides

Professional, polite terms for the `hu-formal` locale:

```typescript
const huFormalOverrides: LocaleMessages = {
  login: {
    rememberMe: 'Maradjon bejelentkezve',  // "you" formal
    forgotPassword: 'Elfelejtette...?'     // "you" formal
  }
}
```

### Consistency Rule

**Every key in formal must have an informal equivalent and vice versa.**

The `check:locale-consistency` script enforces this:

```bash
yarn check:locale-consistency
```

If you add a key to one variant, add it to the other:

```typescript
// ✅ Correct - both variants have the key
const huInformalOverrides = {
  myFeature: { action: 'Csináld' }  // informal
}

const huFormalOverrides = {
  myFeature: { action: 'Tegye' }    // formal
}

// ❌ Wrong - only formal has it
const huFormalOverrides = {
  myFeature: { action: 'Tegye' }
}
// Missing in informal - check will fail!
```

## Translation Utilities

### `getTranslation()`

The core translation function in `src/runtime/utils/locale.ts`:

```typescript
export const getTranslation = (
  key: string,
  locale: string = 'en',
  customTexts?: Record<string, LocaleMessages>,
  fallbackLocale: string = 'en',
  params?: (string | number)[]
): string
```

**Features:**
- Dot notation key lookup (`login.title`)
- Fallback chain: current locale → fallback locale → English
- Parameter replacement (`{0}`, `{1}`, etc.)
- Custom text merging with defaults
- Development-mode parameter count validation

### `deepMerge()`

Merges custom translations with defaults:

```typescript
export const deepMerge = (
  target: LocaleMessages,
  source: LocaleMessages
): LocaleMessages
```

Used to merge user-provided custom translations with module defaults.

### `getNestedValue()`

Retrieves nested values using dot notation:

```typescript
export const getNestedValue = (
  obj: LocaleMessages,
  path: string
): string | undefined
```

Example:
```typescript
getNestedValue(messages, 'login.title')
// Returns messages.login.title
```

## Testing Translations

### Unit Tests

Test individual translation functions:

```typescript
import { describe, it, expect } from 'vitest'
import { getTranslation } from '../../src/runtime/utils/locale'

describe('Translations', () => {
  it('should get correct translation', () => {
    const result = getTranslation('login.title', 'en')
    expect(result).toBe('Welcome Back')
  })
  
  it('should handle parameters', () => {
    const result = getTranslation('userCard.deleteConfirm', 'en', undefined, 'en', ['John'])
    expect(result).toBe('Are you sure you want to delete user John?')
  })
  
  it('should fallback to English', () => {
    const result = getTranslation('login.title', 'nonexistent')
    expect(result).toBe('Welcome Back')  // Falls back to English
  })
})
```

### Integration Tests

Test translations in components:

```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import NUsersLoginForm from '../../src/runtime/components/NUsersLoginForm.vue'

describe('NUsersLoginForm Localization', () => {
  it('should display translated strings', () => {
    const wrapper = mount(NUsersLoginForm, {
      global: {
        mocks: {
          useRuntimeConfig: () => ({
            public: {
              nuxtUsers: {
                locale: { locale: 'hu', fallbackLocale: 'en', texts: {} }
              }
            }
          })
        }
      }
    })
    
    // Check Hungarian translations appear
    expect(wrapper.text()).toContain('Üdvözöljük')
  })
})
```

## Parameter Count Validation

In development mode, the system validates parameter counts:

```typescript
// Translation
deleteConfirm: 'Delete {0}?'

// Correct usage
t('deleteConfirm', ['John'])  // ✅ 1 param expected, 1 provided

// Incorrect usage
t('deleteConfirm', ['John', 'Extra'])  // ⚠️  Warns: expected 1, got 2
t('deleteConfirm')                      // ⚠️  Warns: expected 1, got 0
```

**Warning example:**
```
[nuxt-users locale] Parameter count mismatch for key "deleteConfirm": 
expected 1 parameter(s), but received 2
```

This only runs in development (`NODE_ENV !== 'production'`).

## Best Practices

### 1. Always Test New Translations

```bash
# Run unit tests
yarn test:unit test/unit/locale.test.ts

# Run integration tests
yarn test:unit test/integration/locale-components.test.ts

# Check for hardcoded strings
yarn check:translations

# Check Hungarian consistency
yarn check:locale-consistency
```

### 2. Keep Keys Organized

Use clear, nested structure:

```typescript
// ✅ Good structure
{
  feature: {
    subsection: {
      specificKey: 'value'
    }
  }
}

// ❌ Avoid flat structure
{
  featureSubsectionSpecificKey: 'value'
}
```

### 3. Document New Keys

When adding keys, update:
- User guide documentation (`docs/user-guide/localization.md`)
- This developer guide if adding new sections
- JSDoc comments in type definitions

### 4. Use Consistent Terminology

Maintain consistency across languages:
- Use the same term for the same concept
- Keep button labels consistent (e.g., always "Submit" not mixed with "Send")
- Follow established patterns in existing translations

### 5. Consider Context

Especially for Hungarian formal/informal:
- Login/register forms: Can be friendly (informal) or professional (formal)
- Admin panels: Usually formal
- User profiles: Depends on your app's tone
- Error messages: Keep consistent with rest of app

## Continuous Integration

The translation checks run automatically in CI:

```bash
# In package.json "release" script
yarn check:translations && yarn check:locale-consistency && yarn test
```

This ensures:
- No hardcoded strings sneak into components
- Hungarian variants stay in sync
- All translation tests pass

## Related

- [User Guide: Localization](../user-guide/localization.md) - End-user documentation
- [Testing](./testing.md) - General testing guide
- [Contributing](./contributing.md) - Contributing guidelines
