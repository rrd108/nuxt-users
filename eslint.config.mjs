// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Rules for formatting
    stylistic: true,
  },
  dirs: {
    src: [
      './playground',
    ],
  },
})
  .append(
    {
      rules: {
        // Override quotes rule to use single quotes
        'quotes': ['error', 'single', { avoidEscape: true }],
        'jsx-quotes': ['error', 'prefer-single'],
        '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
        '@stylistic/jsx-quotes': ['error', 'prefer-single'],
        // Disable trailing commas
        'comma-dangle': 'off',
        '@stylistic/comma-dangle': 'off',
        // Disable unified-signatures due to bug with Vue files
        '@typescript-eslint/unified-signatures': 'off',
      },
    },
  )
