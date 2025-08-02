#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, symlinkSync, unlinkSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const distDir = join(projectRoot, 'dist')
const utilsSymlink = join(distDir, 'utils')
const utilsTarget = 'utils.mjs'

// Remove existing symlink if it exists
if (existsSync(utilsSymlink)) {
  try {
    unlinkSync(utilsSymlink)
  } catch (error) {
    // Ignore errors (might be a directory)
  }
}

// Create symlink for CLI to find utils
try {
  symlinkSync(utilsTarget, utilsSymlink)
  console.log('[Nuxt Users] Created symlink for CLI: dist/utils -> utils.mjs')
} catch (error) {
  console.warn('[Nuxt Users] Warning: Could not create symlink for CLI:', error.message)
}