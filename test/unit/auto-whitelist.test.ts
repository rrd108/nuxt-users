import { describe, it, expect } from 'vitest'

// Mock a minimal module options structure for testing the whitelist logic
interface TestModuleOptions {
  auth: {
    whitelist: string[]
  }
}

// Extract the whitelist logic for testing
const getWhitelistWithAutoConfirmEmail = (options: TestModuleOptions) => {
  const combinedWhitelist = [...options.auth.whitelist]
  // Auto-whitelist /confirm-email if /register is whitelisted
  if (combinedWhitelist.includes('/register') && !combinedWhitelist.includes('/confirm-email')) {
    combinedWhitelist.push('/confirm-email')
  }
  return combinedWhitelist
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
})
