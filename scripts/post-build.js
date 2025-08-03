#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, mkdirSync, writeFileSync, rmdirSync, unlinkSync, readdirSync, readFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const distDir = join(projectRoot, 'dist')
const utilsDir = join(distDir, 'utils')
const utilsIndexFile = join(utilsDir, 'index.js')
const utilsRootFile = join(distDir, 'utils.js')

// Remove existing utils directory if it exists
if (existsSync(utilsDir)) {
  try {
    if (existsSync(utilsIndexFile)) {
      unlinkSync(utilsIndexFile)
    }
    rmdirSync(utilsDir)
  }
  catch {
    // Ignore errors
  }
}

// Create utils.js in the dist root to handle "../../../utils" imports
// This allows imports like "../../../utils" to resolve to a file instead of directory
const rootIndexContent = `export * from './utils.mjs'
`
writeFileSync(utilsRootFile, rootIndexContent)

// Note: Types imports should be handled by TypeScript compilation, not runtime

// Fix import paths in built files to include .js extensions for ES modules
const runtimeUtilsDir = join(distDir, 'runtime')

// Function to recursively find and fix import statements
function fixImportPaths(dir) {
  const items = readdirSync(dir, { withFileTypes: true })
  
  for (const item of items) {
    const fullPath = join(dir, item.name)
    
    if (item.isDirectory()) {
      fixImportPaths(fullPath)
    } else if (item.isFile() && item.name.endsWith('.js')) {
      let content = readFileSync(fullPath, 'utf8')
      let modified = false
      
      // Fix relative imports to utils (../../../utils -> ../../../utils.js)
      const utilsImportRegex = /from\s+["'](\.\.[\/\\]){2,}utils["']/g
      if (utilsImportRegex.test(content)) {
        content = content.replace(utilsImportRegex, (match) => match.replace(/utils["']$/, 'utils.js"'))
        modified = true
      }
      
      if (modified) {
        writeFileSync(fullPath, content)
        console.log(`[Nuxt Users] Fixed import paths in ${fullPath}`)
      }
    }
  }
}


fixImportPaths(runtimeUtilsDir)

console.log('[Nuxt Users] Created utils.js file and fixed import paths for ES modules')
