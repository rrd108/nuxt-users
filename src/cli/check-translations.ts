import { defineCommand } from 'citty'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

interface StringMatch {
  file: string
  line: number
  column: number
  content: string
  context: string
}

/**
 * Recursively find all Vue files in a directory
 */
const findVueFiles = (dir: string, fileList: string[] = []): string[] => {
  const files = readdirSync(dir)

  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      findVueFiles(filePath, fileList)
    }
    else if (file.endsWith('.vue')) {
      fileList.push(filePath)
    }
  }

  return fileList
}

/**
 * Check if a string should be ignored (technical strings, not user-facing)
 */
const shouldIgnoreString = (str: string): boolean => {
  const ignoredPatterns = [
    /^[\s\n\r]*$/, // Empty or whitespace only
    /^[a-z-]+$/, // CSS classes, HTML tags, etc. (lowercase with dashes)
    /^[0-9]+$/, // Numbers only
    /^[*]+$/, // Asterisks for password placeholders
    /^[./#@]+$/, // Special chars only
    /^\$/, // Vue/JS variables
    /^v-/, // Vue directives
    /^:/, // Vue bindings
    /^@/, // Vue events
    /^#/, // Template refs
    /^%/, // Placeholders
    /^{/, // Object/template literals
    /^\[/, // Arrays
    /^\//, // Paths/URLs start
    /^https?:\/\//, // URLs
    /^\.\.?\//, // Relative paths
    /^data-/, // Data attributes
    /^aria-/, // ARIA attributes
    /^role$/i, // ARIA role
    /^id$/i, // HTML id
    /^class$/i, // HTML class
    /^src$/i, // HTML src
    /^alt$/i, // HTML alt
    /^type$/i, // HTML type
    /^name$/i, // HTML name
    /^for$/i, // HTML for
    /^t$/i, // Translation function itself
    /^useNuxtUsersLocale$/i, // Composable name
  ]

  return ignoredPatterns.some(pattern => pattern.test(str.trim()))
}

/**
 * Extract template content from Vue file
 */
const extractTemplate = (content: string): string | null => {
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
  return templateMatch ? templateMatch[1] : null
}

/**
 * Find hardcoded strings in template
 */
const findHardcodedStrings = (template: string, filePath: string): StringMatch[] => {
  const matches: StringMatch[] = []
  const lines = template.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    // Skip lines that already use t() function or have Vue directives/bindings
    if (line.includes('t(') || line.includes('{{ t(') || line.includes('v-if') || 
        line.includes('v-else') || line.includes('v-for') || line.includes('v-show') ||
        line.includes('@click') || line.includes('@') || line.includes('viewBox') ||
        line.includes('<path') || line.includes('<svg')) {
      continue
    }

    // Find strings in template interpolations {{ "string" }} or {{ 'string' }}
    const interpolationRegex = /\{\{\s*["']([^"']+)["']\s*\}\}/g
    let match
    while ((match = interpolationRegex.exec(line)) !== null) {
      const str = match[1]
      if (!shouldIgnoreString(str)) {
        matches.push({
          file: filePath,
          line: lineNum,
          column: match.index + 1,
          content: str,
          context: line.trim()
        })
      }
    }

    // Find strings in attributes (but not v-bind:, :, v-on:, @)
    // Match patterns like: attribute="string" but not :attribute="string" or @event="handler"
    // Skip this check entirely for lines with : prefix (Vue bindings)
    if (line.includes(':')) {
      continue
    }
    const attrRegex = /(\w+)=["']([^"']+)["']/g
    while ((match = attrRegex.exec(line)) !== null) {
      const attrName = match[1]
      const attrValue = match[2]
      
      // Skip certain attributes that are typically technical
      const technicalAttrs = ['id', 'class', 'data-', 'aria-', 'role', 'type', 'name', 'for', 'src', 'href', 'alt', 
                               'viewBox', 'd', 'stroke', 'fill', 'xmlns', 'width', 'height', 'to', 'method']
      const isTechnical = technicalAttrs.some(attr => attrName.startsWith(attr))
      
      // Skip if value looks like a variable name, function call, or expression
      if (/^[a-z][a-zA-Z0-9]*$/.test(attrValue) || attrValue.includes('(') || attrValue.includes('.')) {
        continue
      }
      
      if (!isTechnical && !shouldIgnoreString(attrValue) && attrValue.length > 1) {
        matches.push({
          file: filePath,
          line: lineNum,
          column: match.index + 1,
          content: attrValue,
          context: line.trim()
        })
      }
    }

    // Find text content between tags (but not inside {{ }})
    // This is a simplified check - a full parser would be better but more complex
    const textContentRegex = />([^<{]+)</g
    while ((match = textContentRegex.exec(line)) !== null) {
      const text = match[1].trim()
      
      // Check if it's actual text content (contains letters and is meaningful)
      if (text && /[a-zA-Z]{2,}/.test(text) && !shouldIgnoreString(text)) {
        // Skip if it's inside a comment
        if (!line.includes('<!--') || line.indexOf('-->') < match.index) {
          matches.push({
            file: filePath,
            line: lineNum,
            column: match.index + 1,
            content: text,
            context: line.trim()
          })
        }
      }
    }
  }

  return matches
}

export default defineCommand({
  meta: {
    name: 'check-translations',
    description: 'Check Vue files for hardcoded strings that should use t() function'
  },
  args: {
    path: {
      type: 'string',
      description: 'Path to scan (defaults to src/runtime/components)',
      default: 'src/runtime/components'
    },
    strict: {
      type: 'boolean',
      description: 'Enable strict mode (report all potential strings)',
      default: false
    }
  },
  async run({ args }) {
    try {
      const scanPath = join(process.cwd(), args.path)
      console.log(`[Nuxt Users] 🔍 Scanning Vue files in: ${scanPath}`)
      console.log()

      const vueFiles = findVueFiles(scanPath)
      
      if (vueFiles.length === 0) {
        console.log('[Nuxt Users] ⚠️  No Vue files found in the specified path')
        return
      }

      console.log(`[Nuxt Users] 📄 Found ${vueFiles.length} Vue file(s)`)
      console.log()

      let totalMatches = 0
      const fileResults: Record<string, StringMatch[]> = {}

      for (const filePath of vueFiles) {
        const content = readFileSync(filePath, 'utf8')
        const template = extractTemplate(content)

        if (!template) {
          continue
        }

        const matches = findHardcodedStrings(template, filePath)
        
        if (matches.length > 0) {
          const relativePath = relative(process.cwd(), filePath)
          fileResults[relativePath] = matches
          totalMatches += matches.length
        }
      }

      if (totalMatches === 0) {
        console.log('[Nuxt Users] ✅ No hardcoded strings found! All strings appear to use t()')
        console.log()
        return
      }

      console.log(`[Nuxt Users] ⚠️  Found ${totalMatches} potential hardcoded string(s):\n`)

      for (const [file, matches] of Object.entries(fileResults)) {
        console.log(`📁 ${file}`)
        
        for (const match of matches) {
          console.log(`   Line ${match.line}:${match.column}`)
          console.log(`   String: "${match.content}"`)
          console.log(`   Context: ${match.context}`)
          console.log()
        }
      }

      console.log('[Nuxt Users] 💡 Tip: Replace hardcoded strings with t() function from useNuxtUsersLocale()')
      console.log('[Nuxt Users] Example: "Login" → {{ t(\'login.submit\') }}')
      console.log()

      // Exit with error code if hardcoded strings found
      process.exit(1)
    }
    catch (error) {
      console.error('[Nuxt Users] ❌ Error:', error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  }
})
