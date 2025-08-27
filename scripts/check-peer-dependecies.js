#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const REQUIRED_PEERS = ['bcrypt', 'nodemailer', '@nuxt/kit']
const OPTIONAL_PEERS = ['nuxt-api-shield']

function checkPackageJson() {
  const missing = []
  const optional = []

  try {
    // Look for package.json in the consumer app (current working directory)
    const pkgPath = join(process.cwd(), 'package.json')

    if (!existsSync(pkgPath)) {
      console.log('⚠️  Could not find package.json in current directory')
      return { missing: REQUIRED_PEERS, optional: OPTIONAL_PEERS }
    }

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

    // Check all possible dependency locations
    const allDeps = {
      ...pkg.dependencies || {},
      ...pkg.devDependencies || {},
      ...pkg.peerDependencies || {}
    }

    // Check required dependencies
    for (const dep of REQUIRED_PEERS) {
      if (!allDeps[dep]) {
        missing.push(dep)
      }
    }

    // Check optional dependencies
    for (const dep of OPTIONAL_PEERS) {
      if (!allDeps[dep]) {
        optional.push(dep)
      }
    }

    return { missing, optional, packageName: pkg.name || 'your project' }
  }
  catch (error) {
    console.log('⚠️  Error reading package.json:', error.message)
    // If we can't read package.json, assume all deps are missing
    return { missing: REQUIRED_PEERS, optional: OPTIONAL_PEERS, packageName: 'your project' }
  }
}

function getPackageManagerCommand() {
  // Detect package manager from lock files or environment
  const cwd = process.cwd()

  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm add'
  }
  else if (existsSync(join(cwd, 'yarn.lock'))) {
    return 'yarn add'
  }
  else if (existsSync(join(cwd, 'package-lock.json'))) {
    return 'npm install'
  }
  else if (process.env.npm_config_user_agent?.includes('pnpm')) {
    return 'pnpm add'
  }
  else if (process.env.npm_config_user_agent?.includes('yarn')) {
    return 'yarn add'
  }

  // Default fallback
  return 'npm install'
}

function displayResults({ missing, optional, packageName }) {
  const primaryCmd = getPackageManagerCommand()

  if (missing.length > 0) {
    console.log('\n🚨 nuxt-users: Missing required peer dependencies!')
    console.log(`Project: ${packageName}`)
    console.log('These dependencies are required for nuxt-users to work properly.\n')

    console.log('💾 Missing dependencies:')
    missing.forEach(dep => console.log(`  - ${dep}`))
    console.log('')

    console.log('🔧 Install command (detected):')
    console.log(`  ${primaryCmd} ${missing.join(' ')}\n`)

    console.log('🔧 Alternative install commands:')
    console.log(`  npm install ${missing.join(' ')}`)
    console.log(`  pnpm add ${missing.join(' ')}`)
    console.log(`  yarn add ${missing.join(' ')}\n`)

    console.log('📚 Documentation: https://nuxt-users.webmania.cc/installation')
    console.log('🐛 Issues: https://github.com/rrd108/nuxt-users/issues\n')

    // Exit with error code to make installation fail
    process.exit(1)
  }

  if (optional.length > 0 && missing.length === 0) {
    console.log('\n💡 nuxt-users: Optional dependencies available!')
    console.log(`Project: ${packageName}`)
    console.log('These provide additional security and features:\n')

    console.log('🔒 Optional dependencies:')
    optional.forEach(dep => console.log(`  - ${dep}`))
    console.log('')

    console.log('🔧 Install command (detected):')
    console.log(`  ${primaryCmd} ${optional.join(' ')}\n`)

    console.log('🔧 Alternative install commands:')
    console.log(`  npm install ${optional.join(' ')}`)
    console.log(`  pnpm add ${optional.join(' ')}`)
    console.log(`  yarn add ${optional.join(' ')}\n`)
  }

  if (missing.length === 0 && optional.length === 0) {
    console.log(`✅ nuxt-users: All dependencies found in ${packageName}!`)
  }
  else if (missing.length === 0) {
    console.log(`✅ nuxt-users: All required dependencies found in ${packageName}!`)
  }
}

async function checkPeerDependencies() {
  const result = checkPackageJson()
  displayResults(result)
}

// Handle both direct execution and module import
if (import.meta.url === `file://${process.argv[1]}`) {
  checkPeerDependencies().catch(console.error)
}

export { checkPeerDependencies }
