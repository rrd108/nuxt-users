#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))
const version = packageJson.version

// Read the CLI source file
const cliPath = join(process.cwd(), 'src/cli/main.ts')
let cliContent = readFileSync(cliPath, 'utf8')

// Replace the version placeholder
cliContent = cliContent.replace(/__VERSION__/g, version)

// Write back to the file
writeFileSync(cliPath, cliContent)

console.log(`[Nuxt Users] Updated CLI version to ${version}`)
