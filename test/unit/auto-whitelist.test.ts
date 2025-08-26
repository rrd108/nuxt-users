import { describe, it, expect } from 'vitest'

// Mock a minimal module options structure for testing the whitelist logic
interface TestModuleOptions {
  auth: {
    whitelist: string[]
  }
  apiBasePath?: string
}

// Extract the whitelist logic for testing (matching the module.ts logic)
const getWhitelistWithAutoRegistrationEndpoints = (options: TestModuleOptions) => {
  const combinedWhitelist = [...options.auth.whitelist]
  // Auto-whitelist related endpoints if /register is whitelisted
  if (combinedWhitelist.includes('/register')) {
    const apiBasePath = options.apiBasePath || '/api/nuxt-users'
    const registrationEndpoints = [
      '/confirm-email',  // Page route for email confirmation
      `${apiBasePath}/register`,  // API endpoint for registration
      `${apiBasePath}/confirm-email`  // API endpoint for email confirmation
    ]
    
    registrationEndpoints.forEach(endpoint => {
      if (!combinedWhitelist.includes(endpoint)) {
        combinedWhitelist.push(endpoint)
      }
    })
  }
  return combinedWhitelist
}

// Keep backward compatibility helper for existing tests
const getWhitelistWithAutoConfirmEmail = (options: TestModuleOptions) => {
  return getWhitelistWithAutoRegistrationEndpoints(options)
}

describe('Auto-whitelist functionality', () => {
  it('should auto-add /confirm-email when /register is whitelisted', () => {
    const options: TestModuleOptions = {
      auth: {
        whitelist: ['/noauth', '/register']
      }
    }

    const result = getWhitelistWithAutoConfirmEmail(options)

    expect(result).toContain('/register')
    expect(result).toContain('/confirm-email')
    expect(result).toContain('/noauth')
  })

  it('should not duplicate /confirm-email if already present', () => {
    const options: TestModuleOptions = {
      auth: {
        whitelist: ['/noauth', '/register', '/confirm-email']
      }
    }

    const result = getWhitelistWithAutoConfirmEmail(options)

    expect(result.filter(route => route === '/confirm-email')).toHaveLength(1)
  })

  it('should not add /confirm-email if /register is not whitelisted', () => {
    const options: TestModuleOptions = {
      auth: {
        whitelist: ['/noauth', '/login']
      }
    }

    const result = getWhitelistWithAutoConfirmEmail(options)

    expect(result).not.toContain('/confirm-email')
    expect(result).toContain('/noauth')
    expect(result).toContain('/login')
  })

  it('should handle empty whitelist', () => {
    const options: TestModuleOptions = {
      auth: {
        whitelist: []
      }
    }

    const result = getWhitelistWithAutoConfirmEmail(options)

    expect(result).not.toContain('/confirm-email')
    expect(result).toHaveLength(0)
  })

  it('should auto-add registration API endpoints when /register is whitelisted', () => {
    const options: TestModuleOptions = {
      auth: {
        whitelist: ['/register']
      }
    }

    const result = getWhitelistWithAutoRegistrationEndpoints(options)

    expect(result).toContain('/register')
    expect(result).toContain('/confirm-email')
    expect(result).toContain('/api/nuxt-users/register')
    expect(result).toContain('/api/nuxt-users/confirm-email')
    expect(result).toHaveLength(4)
  })

  it('should use custom API base path for registration endpoints', () => {
    const options: TestModuleOptions = {
      auth: {
        whitelist: ['/register']
      },
      apiBasePath: '/api/custom-users'
    }

    const result = getWhitelistWithAutoRegistrationEndpoints(options)

    expect(result).toContain('/register')
    expect(result).toContain('/confirm-email')
    expect(result).toContain('/api/custom-users/register')
    expect(result).toContain('/api/custom-users/confirm-email')
    expect(result).not.toContain('/api/nuxt-users/register')
  })

  it('should not duplicate API endpoints if already present', () => {
    const options: TestModuleOptions = {
      auth: {
        whitelist: ['/register', '/api/nuxt-users/register']
      }
    }

    const result = getWhitelistWithAutoRegistrationEndpoints(options)

    expect(result.filter(route => route === '/api/nuxt-users/register')).toHaveLength(1)
    expect(result).toContain('/confirm-email')
    expect(result).toContain('/api/nuxt-users/confirm-email')
  })
})
