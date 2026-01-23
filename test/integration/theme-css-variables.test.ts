import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Theme CSS Variables Integration', () => {
  const cssPath = join(process.cwd(), 'src/runtime/assets/nuxt-users.css')
  const cssContent = readFileSync(cssPath, 'utf-8')

  it('should have :root:not(.light) selector in dark media query to prevent dark theme when .light class is present', () => {
    // This test verifies the fix: the media query should use :root:not(.light)
    // to prevent dark theme from applying when .light class is present.
    // The fix ensures that even if system preference is dark, the .light class
    // will prevent dark theme CSS variables from applying.
    const mediaQueryRegex = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?:root:not\(\.light\)/

    expect(cssContent).toMatch(mediaQueryRegex)

    // Verify the selector appears BEFORE the closing brace of the media query
    // This ensures it's actually inside the media query, not outside
    const mediaQueryStart = cssContent.indexOf('@media (prefers-color-scheme: dark)')
    const mediaQueryEnd = cssContent.indexOf('}', mediaQueryStart + 100) // Find first closing brace after media query start
    const notLightSelector = cssContent.indexOf(':root:not(.light)', mediaQueryStart)

    expect(notLightSelector).toBeGreaterThan(mediaQueryStart)
    expect(notLightSelector).toBeLessThan(mediaQueryEnd)
  })

  it('should have :root.dark selector for explicit dark theme', () => {
    // Verify that :root.dark selector exists for explicit dark theme
    expect(cssContent).toContain(':root.dark {')
  })

  it('should define dark theme CSS variables in media query with :root:not(.light) to ensure .light class overrides system preference', () => {
    // Verify that dark theme variables are defined within the :root:not(.light) selector.
    // This ensures that when .light class is present, these dark theme variables won't apply
    // even if the system preference is dark - which is the core fix we're testing.
    const mediaQueryIndex = cssContent.indexOf('@media (prefers-color-scheme: dark)')
    const notLightIndex = cssContent.indexOf(':root:not(.light)', mediaQueryIndex)
    const darkBgIndex = cssContent.indexOf('--nu-color-bg-primary: #111827', notLightIndex)

    expect(mediaQueryIndex).toBeGreaterThan(-1)
    expect(notLightIndex).toBeGreaterThan(mediaQueryIndex)
    expect(darkBgIndex).toBeGreaterThan(notLightIndex)

    // Verify the dark theme variable appears after the :root:not(.light) selector
    // This confirms the variable is scoped to that selector
    const notLightBlockEnd = cssContent.indexOf('}', notLightIndex)
    expect(darkBgIndex).toBeLessThan(notLightBlockEnd)
  })

  it('should define dark theme CSS variables in :root.dark selector', () => {
    // Verify that dark theme variables are also defined in :root.dark selector
    const darkSection = cssContent.split(':root.dark {')[1]?.split('}')[0] || ''
    expect(darkSection).toContain('--nu-color-bg-primary: #111827')
    expect(darkSection).toContain('--nu-color-text-primary: #ffffff')
  })

  it('should define light theme CSS variables in default :root', () => {
    // Verify that light theme variables are defined in the default :root
    const rootSection = cssContent.split(':root {')[1]?.split('}')[0] || ''
    expect(rootSection).toContain('--nu-color-bg-primary: #ffffff')
    expect(rootSection).toContain('--nu-color-text-primary: #000000')
  })
})
