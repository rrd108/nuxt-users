import { useRuntimeConfig } from '#app'
import { PUBLIC_PAGES, PUBLIC_API_ENDPOINTS } from '../constants'
import { resolveAccess } from '../utils/route-access'
import { useAuthentication } from './useAuthentication'
import type { RuntimeModuleOptions } from 'nuxt-users/utils'

/**
 * Composable to get public paths and accessible paths for current user
 * @returns Object containing different categories of accessible paths
 */
export const usePublicPaths = () => {
  const { public: { nuxtUsers } } = useRuntimeConfig()
  const config = nuxtUsers as RuntimeModuleOptions
  const apiBasePath = config.apiBasePath || '/api/nuxt-users'
  const { user } = useAuthentication()

  /**
   * Get all truly public paths that don't require authentication at all
   * These are accessible by anyone, regardless of authentication status
   */
  const getPublicPaths = () => {
    // Built-in no-auth page paths
    const publicPages = [...PUBLIC_PAGES]

    // Built-in no-auth API paths (with base path prefix)
    const publicApiEndpoints = PUBLIC_API_ENDPOINTS.map(endpoint => `${endpoint.methods.join(', ')}: ${apiBasePath}${endpoint.path}`)

    // Custom whitelisted paths from configuration (truly public, no auth required)
    const whitelistedPaths = config.auth?.whitelist || []

    // Custom password reset URL if different from default
    const customPasswordResetPath = config.passwordResetUrl && config.passwordResetUrl !== '/reset-password'
      ? config.passwordResetUrl
      : null

    const allPublicPaths = [
      ...publicPages,
      ...publicApiEndpoints,
      ...whitelistedPaths
    ]

    if (customPasswordResetPath) {
      allPublicPaths.push(customPasswordResetPath)
    }

    return {
      // All truly public paths (no auth required)
      all: allPublicPaths,
      // Categorized public paths
      builtIn: {
        pages: publicPages,
        api: publicApiEndpoints
      },
      whitelist: whitelistedPaths,
      customPasswordResetPath,
      apiBasePath
    }
  }

  /**
   * Get all paths accessible to the current authenticated user
   * This includes public paths + role-based accessible paths
   */
  const getAccessiblePaths = () => {
    const publicPaths = getPublicPaths()

    // If no user is authenticated, only return public paths
    if (!user.value) {
      return {
        all: publicPaths.all,
        public: publicPaths.all,
        roleBasedPaths: [],
        userRole: null
      }
    }

    // Get user's role-based permissions
    const userRole = user.value.role
    const permissions = config.auth?.permissions || {}
    const rolePermissions = permissions[userRole] || []

    // Extract allowed paths from role permissions
    const roleBasedPaths: string[] = []

    rolePermissions.forEach((permission) => {
      if (typeof permission === 'string') {
        roleBasedPaths.push(permission)
      }
      if (typeof permission === 'object' && permission.path) {
        roleBasedPaths.push(permission.path)
      }
    })

    return {
      all: [...publicPaths.all, ...roleBasedPaths],
      public: publicPaths.all,
      roleBasedPaths,
      userRole
    }
  }

  /**
   * Check if a specific path is accessible to the current user, with the same rules as the authorization middleware
   * @param path - The path to check
   * @param method - HTTP method (default: 'GET')
   * @returns boolean indicating if the path is accessible
   */
  const isAccessiblePath = (path: string, method: string = 'GET'): boolean => {
    return resolveAccess(path, method, config, user.value).allowed
  }

  /**
   * Check if a path is truly public (no authentication required)
   * @param path - The path to check
   * @param method - HTTP method (default: 'GET'); public API endpoints are only public for their methods
   * @returns boolean indicating if the path is public
   */
  const isPublicPath = (path: string, method: string = 'GET'): boolean => {
    return resolveAccess(path, method, config).allowed
  }

  return {
    getPublicPaths,
    getAccessiblePaths,
    isPublicPath,
    isAccessiblePath
  }
}
