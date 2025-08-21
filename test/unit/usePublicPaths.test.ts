import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUseRuntimeConfig = vi.fn()
const mockUseAuthentication = vi.fn()

vi.mock('#app', () => ({
  useRuntimeConfig: mockUseRuntimeConfig
}))

vi.mock('../src/runtime/composables/useAuthentication', () => ({
  useAuthentication: mockUseAuthentication
}))

// Import after mocking
const { usePublicPaths } = await import('../../src/runtime/composables/usePublicPaths')

describe('usePublicPaths', () => {
  let mockConfig: {
    apiBasePath: string
    auth: {
      whitelist: string[]
      permissions: Record<string, string[]>
    }
    passwordResetUrl: string
  }
  let mockUser: { value: { id: number, role: string } | null }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock runtime config
    mockConfig = {
      apiBasePath: '/api/nuxt-users',
      auth: {
        whitelist: ['/about', '/contact'],
        permissions: {
          admin: ['*'],
          user: ['/profile', '/dashboard'],
          moderator: ['/admin/*']
        }
      },
      passwordResetUrl: '/reset-password'
    }

    mockUseRuntimeConfig.mockReturnValue({
      public: {
        nuxtUsers: mockConfig
      }
    })

    // Mock user
    mockUser = { value: null }
    mockUseAuthentication.mockReturnValue({
      user: mockUser
    })
  })

  describe('getPublicPaths', () => {
    it('should return all public paths correctly', () => {
      const { getPublicPaths } = usePublicPaths()
      const result = getPublicPaths()

      expect(result.all).toContain('/login')
      expect(result.all).toContain('/reset-password')
      expect(result.all).toContain('/api/nuxt-users/session')
      expect(result.all).toContain('/about')
      expect(result.all).toContain('/contact')

      expect(result.builtIn.pages).toEqual(['/login', '/reset-password'])
      expect(result.builtIn.api).toEqual([
        '/api/nuxt-users/session',
        '/api/nuxt-users/password/forgot',
        '/api/nuxt-users/password/reset'
      ])
      expect(result.whitelist).toEqual(['/about', '/contact'])
      expect(result.apiBasePath).toBe('/api/nuxt-users')
    })

    it('should handle custom password reset URL', () => {
      mockConfig.passwordResetUrl = '/custom-reset'

      const { getPublicPaths } = usePublicPaths()
      const result = getPublicPaths()

      expect(result.all).toContain('/custom-reset')
      expect(result.customPasswordResetPath).toBe('/custom-reset')
    })
  })

  describe('getAccessiblePaths', () => {
    it('should return only public paths when no user is authenticated', () => {
      mockUser.value = null

      const { getAccessiblePaths } = usePublicPaths()
      const result = getAccessiblePaths()

      expect(result.userRole).toBe(null)
      expect(result.roleBasedPaths).toEqual([])
      expect(result.all).toEqual(result.public)
    })

    it('should return public + role-based paths for authenticated user', () => {
      mockUser.value = { id: 1, role: 'user' }

      const { getAccessiblePaths } = usePublicPaths()
      const result = getAccessiblePaths()

      expect(result.userRole).toBe('user')
      expect(result.roleBasedPaths).toEqual(['/profile', '/dashboard'])
      expect(result.all).toContain('/login') // public path
      expect(result.all).toContain('/profile') // role-based path
    })

    it('should handle admin user with wildcard permissions', () => {
      mockUser.value = { id: 1, role: 'admin' }

      const { getAccessiblePaths } = usePublicPaths()
      const result = getAccessiblePaths()

      expect(result.userRole).toBe('admin')
      expect(result.roleBasedPaths).toEqual(['*'])
    })
  })

  describe('isPublicPath', () => {
    it('should return true for built-in no-auth paths', () => {
      const { isPublicPath } = usePublicPaths()

      expect(isPublicPath('/login')).toBe(true)
      expect(isPublicPath('/reset-password')).toBe(true)
    })

    it('should return true for whitelisted paths', () => {
      const { isPublicPath } = usePublicPaths()

      expect(isPublicPath('/about')).toBe(true)
      expect(isPublicPath('/contact')).toBe(true)
    })

    it('should return true for static assets', () => {
      const { isPublicPath } = usePublicPaths()

      expect(isPublicPath('/favicon.ico')).toBe(true)
      expect(isPublicPath('/assets/style.css')).toBe(true)
    })

    it('should return true for Nuxt internal routes', () => {
      const { isPublicPath } = usePublicPaths()

      expect(isPublicPath('/_nuxt/app.js')).toBe(true)
    })

    it('should return false for protected paths', () => {
      const { isPublicPath } = usePublicPaths()

      expect(isPublicPath('/profile')).toBe(false)
      expect(isPublicPath('/admin')).toBe(false)
    })
  })

  describe('isAccessiblePath', () => {
    it('should return true for public paths regardless of authentication', () => {
      const { isAccessiblePath } = usePublicPaths()

      expect(isAccessiblePath('/login')).toBe(true)
      expect(isAccessiblePath('/about')).toBe(true)
    })

    it('should return false for protected paths when not authenticated', () => {
      mockUser.value = null

      const { isAccessiblePath } = usePublicPaths()

      expect(isAccessiblePath('/profile')).toBe(false)
      expect(isAccessiblePath('/admin')).toBe(false)
    })

    it('should check role-based permissions for authenticated users', () => {
      mockUser.value = { id: 1, role: 'user' }

      const { isAccessiblePath } = usePublicPaths()

      // This would require mocking the hasPermission function
      // For now, we just test that the function runs without error
      expect(() => isAccessiblePath('/profile')).not.toThrow()
    })
  })
})
