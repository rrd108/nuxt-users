import { defineCommand } from 'citty'
import { loadNuxt } from '@nuxt/kit'
import type { ModuleOptions } from '../types'

export default defineCommand({
  meta: {
    name: 'project-info',
    description: 'Get information about the Nuxt project and module configuration'
  },
  async run() {
    try {
      console.log('[Nuxt Users] Loading Nuxt project...')
      const nuxt = await loadNuxt({ cwd: process.cwd() })

      console.log('✅ Nuxt project loaded successfully!')
      console.log('📁 Source directory:', nuxt.options.srcDir)
      console.log('🌐 Base URL:', nuxt.options.app?.baseURL || '/')

      // Check if nuxt-users module is configured
      const nuxtUsersConfig = nuxt.options.runtimeConfig?.nuxtUsers as ModuleOptions
      if (nuxtUsersConfig) {
        console.log('🔧 Nuxt Users module configuration:')
        console.log('   Database connector:', nuxtUsersConfig.connector?.name)
        console.log('   Users table:', nuxtUsersConfig.tables?.users)
        console.log('   Personal access tokens table:', nuxtUsersConfig.tables?.personalAccessTokens)
        console.log('   Password reset tokens table:', nuxtUsersConfig.tables?.passwordResetTokens)
      }
      else {
        console.log('⚠️  Nuxt Users module not configured in runtime config')
      }

      // Check public runtime config
      const publicConfig = nuxt.options.runtimeConfig?.public?.nuxtUsers as ModuleOptions
      if (publicConfig) {
        console.log('🌍 Public runtime config:')
        console.log('   Users table exists:', publicConfig.tables?.users)
        console.log('   Personal access tokens table exists:', publicConfig.tables?.personalAccessTokens)
        console.log('   Password reset tokens table exists:', publicConfig.tables?.passwordResetTokens)
      }
    }
    catch (error) {
      console.error('❌ Could not load Nuxt project:', error)
      process.exit(1)
    }
  }
})
