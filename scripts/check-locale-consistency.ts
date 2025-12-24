#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

/**
 * Get all translation keys from the Hungarian locale file
 */
const getHungarianKeys = (): { base: Set<string>, informal: Set<string>, formal: Set<string> } => {
  const huFilePath = join(rootDir, 'src/runtime/locales/hu.ts')
  const content = readFileSync(huFilePath, 'utf8')

  // Extract huBase object
  const baseMatch = content.match(/const huBase: LocaleMessages = \{([\s\S]*?)\n\}/)
  if (!baseMatch) {
    throw new Error('Could not find huBase in hu.ts')
  }

  // Extract huInformalOverrides object
  const informalMatch = content.match(/const huInformalOverrides: LocaleMessages = \{([\s\S]*?)\n\}/)
  if (!informalMatch) {
    throw new Error('Could not find huInformalOverrides in hu.ts')
  }

  // Extract huFormalOverrides object
  const formalMatch = content.match(/const huFormalOverrides: LocaleMessages = \{([\s\S]*?)\n\}/)
  if (!formalMatch) {
    throw new Error('Could not find huFormalOverrides in hu.ts')
  }

  // Parse the objects (simple parsing for nested structures)
  const parseKeys = (objString: string): Set<string> => {
    const keys = new Set<string>()
    const lines = objString.split('\n')
    const stack: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//')) {
        continue
      }

      // Check for opening brace (nested object)
      if (trimmed.match(/^(\w+):\s*\{/)) {
        const match = trimmed.match(/^(\w+):\s*\{/)
        if (match && match[1]) {
          stack.push(match[1])
        }
        continue
      }

      // Check for closing brace
      if (trimmed === '},') {
        stack.pop()
        continue
      }

      // Check for key-value pair
      if (trimmed.match(/^(\w+):/)) {
        const match = trimmed.match(/^(\w+):/)
        if (match) {
          const key = match[1]
          const fullKey = stack.length > 0 ? `${stack.join('.')}.${key}` : key
          if (fullKey) {
            keys.add(fullKey)
          }
        }
      }
    }

    return keys
  }

  const baseKeys = parseKeys(baseMatch[1] || '')
  const informalKeys = parseKeys(informalMatch[1] || '')
  const formalKeys = parseKeys(formalMatch[1] || '')

  return { base: baseKeys, informal: informalKeys, formal: formalKeys }
}

/**
 * Check for consistency issues
 */
const checkConsistency = () => {
  console.log('[Nuxt Users] 🔍 Checking Hungarian locale formal/informal consistency...\n')

  const { base, informal, formal } = getHungarianKeys()

  console.log('[Nuxt Users] 📊 Statistics:')
  console.log(`   Base keys: ${base.size}`)
  console.log(`   Informal override keys: ${informal.size}`)
  console.log(`   Formal override keys: ${formal.size}`)
  console.log()

  // Check 1: Formal keys that don't exist in informal
  const formalOnlyKeys: string[] = []
  for (const key of formal) {
    if (!informal.has(key)) {
      formalOnlyKeys.push(key)
    }
  }

  // Check 2: Informal keys that don't exist in formal
  const informalOnlyKeys: string[] = []
  for (const key of informal) {
    if (!formal.has(key)) {
      informalOnlyKeys.push(key)
    }
  }

  let hasErrors = false

  if (formalOnlyKeys.length > 0) {
    hasErrors = true
    console.log('❌ Formal keys without informal equivalent:\n')
    for (const key of formalOnlyKeys.sort()) {
      console.log(`   - ${key}`)
    }
    console.log()
  }

  if (informalOnlyKeys.length > 0) {
    hasErrors = true
    console.log('❌ Informal keys without formal equivalent:\n')
    for (const key of informalOnlyKeys.sort()) {
      console.log(`   - ${key}`)
    }
    console.log()
  }

  if (hasErrors) {
    console.log('[Nuxt Users] ⚠️  Inconsistencies found!')
    console.log('[Nuxt Users] 💡 Tip: All formal variants must have an informal equivalent and vice versa.')
    console.log('[Nuxt Users]      This ensures consistent translations across both Hungarian variants.')
    console.log()
    process.exit(1)
  }

  console.log('[Nuxt Users] ✅ All formal/informal translations are consistent!')
  console.log()
}

// Main execution
try {
  checkConsistency()
}
catch (error) {
  console.error('[Nuxt Users] ❌ Error:', error instanceof Error ? error.message : 'Unknown error')
  process.exit(1)
}
