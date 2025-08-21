import { useRuntimeConfig } from '#app'
import { NO_AUTH_PATHS, NO_AUTH_API_PATHS } from '../constants'
import { hasPermission, isWhitelisted } from '../utils/permissions'
import { useAuthentication } from './useAuthentication'
import type { ModuleOptions } from 'nuxt-users/utils'

/**
 * Composable to get public paths and accessible paths for current user
 * @returns Object containing different categories of accessible paths
 */
export const usePublicPaths = () => {
  const { public: { nuxtUsers } } = useRuntimeConfig()
  const config = nuxtUsers as ModuleOptions
  const apiBasePath = config.apiBasePath || '/api/nuxt-users'
  const { user } = useAuthentication()

  /**
   * Get all truly public paths that don't require authentication at all
   * These are accessible by anyone, regardless of authentication status
   */
  const getPublicPaths = () => {
    // Built-in no-auth page paths
    const noAuthPaths = [...NO_AUTH_PATHS]

    // Built-in no-auth API paths (with base path prefix)
    const noAuthApiPaths = NO_AUTH_API_PATHS.map(path => `${apiBasePath}${path}`)

    // Custom whitelisted paths from configuration (truly public, no auth required)
    const whitelistedPaths = config.auth?.whitelist || []

    // Custom password reset URL if different from default
    const customPasswordResetPath = config.passwordResetUrl && config.passwordResetUrl !== '/reset-password'
      ? config.passwordResetUrl
      : null

    const allPublicPaths = [
      ...noAuthPaths,
      ...noAuthApiPaths,
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
        pages: noAuthPaths,
        api: noAuthApiPaths
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
      else if (typeof permission === 'object' && permission.path) {
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
   * Check if a specific path is accessible to the current user
   * @param path - The path to check
   * @param method - HTTP method (default: 'GET')
   * @returns boolean indicating if the path is accessible
   */
  const isAccessiblePath = (path: string, method: string = 'GET'): boolean => {
    // Check if it's a static asset (contains a dot) - always public
    if (path.includes('.')) {
      return true
    }

    // Check if it's a Nuxt internal route - always public
    if (path.startsWith('/_')) {
      return true
    }

    // Check built-in no-auth paths
    if (NO_AUTH_PATHS.includes(path)) {
      return true
    }

    // Check built-in no-auth API paths
    const noAuthApiPaths = NO_AUTH_API_PATHS.map(p => `${apiBasePath}${p}`)
    if (noAuthApiPaths.includes(path)) {
      return true
    }

    // Check custom password reset path
    if (config.passwordResetUrl && config.passwordResetUrl !== '/reset-password' && path === config.passwordResetUrl) {
      return true
    }

    // Check whitelisted paths (truly public, no auth required)
    if (isWhitelisted(path, config.auth?.whitelist || [])) {
      return true
    }

    // If user is authenticated, check role-based permissions
    if (user.value) {
      return hasPermission(user.value.role, path, method, config.auth?.permissions || {})
    }

    // Not public and no authenticated user
    return false
  }

  /**
   * Check if a path is truly public (no authentication required)
   * @param path - The path to check
   * @returns boolean indicating if the path is public
   */
  const isPublicPath = (path: string): boolean => {
    // Check if it's a static asset (contains a dot)
    if (path.includes('.')) {
      return true
    }

    // Check if it's a Nuxt internal route
    if (path.startsWith('/_')) {
      return true
    }

    // Check built-in no-auth paths
    if (NO_AUTH_PATHS.includes(path)) {
      return true
    }

    // Check built-in no-auth API paths
    const noAuthApiPaths = NO_AUTH_API_PATHS.map(p => `${apiBasePath}${p}`)
    if (noAuthApiPaths.includes(path)) {
      return true
    }

    // Check custom password reset path
    if (config.passwordResetUrl && config.passwordResetUrl !== '/reset-password' && path === config.passwordResetUrl) {
      return true
    }

    // Check whitelisted paths (truly public)
    return isWhitelisted(path, config.auth?.whitelist || [])
  }

  return {
    getPublicPaths,
    getAccessiblePaths,
    isPublicPath,
    isAccessiblePath
  }
}
