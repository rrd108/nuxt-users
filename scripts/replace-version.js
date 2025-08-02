#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))
const version = packageJson.version

// Read the CLI source file
const cliPath = join(process.cwd(), 'src/cli/main.ts')
let cliContent = readFileSync(cliPath, 'utf8')

// Replace the version placeholder or update existing version
const versionPattern = /version:\s*['"`]([^'"`]+)['"`]/
const newCliContent = cliContent.replace(versionPattern, `version: '${version}'`)

// Only write back if there was a change
if (newCliContent !== cliContent) {
  writeFileSync(cliPath, newCliContent)
  console.log(`[Nuxt Users] Updated CLI version to ${version}`)
}
else {
  console.log(`[Nuxt Users] CLI version already up to date (${version})`)
}
