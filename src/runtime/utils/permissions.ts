import type { Permission } from 'nuxt-users/utils'

/**
 * Checks if a path matches a pattern (supports wildcards)
 * @param path - The path to check
 * @param pattern - The pattern to match against (supports * wildcard)
 * @returns true if the path matches the pattern
 */
export const pathMatchesPattern = (path: string, pattern: string): boolean => {
  // Exact match
  if (path === pattern) {
    return true
  }

  // Wildcard match
  if (pattern === '*') {
    return true
  }

  // Pattern with multiple wildcards (use regex)
  if ((pattern.match(/\*/g) || []).length > 1) {
    const regexPattern = pattern
      .replace(/\*/g, '[^/]*')
    const regex = new RegExp(`^${regexPattern}`)
    return regex.test(path)
  }

  // Pattern with wildcard at the end (simple case)
  if (pattern.endsWith('/*')) {
    const basePattern = pattern.slice(0, -2)
    return path === basePattern || path.startsWith(basePattern + '/')
  }

  // Pattern with single wildcard in the middle
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/\*/g, '[^/]*')
    const regex = new RegExp(`^${regexPattern}`)
    return regex.test(path)
  }

  return false
}

/**
 * Checks if a user has permission to access a specific path with a given method
 * @param userRole - The user's role
 * @param path - The path being accessed
 * @param method - The HTTP method being used
 * @param permissions - The permissions configuration
 * @returns true if the user has permission
 */
export const hasPermission = (
  userRole: string,
  path: string,
  method: string,
  permissions: Record<string, (string | Permission)[]>
): boolean => {
  // Always allow safe, non-data-modifying methods
  const safeMethods = ['OPTIONS', 'HEAD', 'TRACE']
  if (safeMethods.includes(method.toUpperCase())) {
    return true
  }

  // If no permissions are configured, deny access (whitelist approach)
  if (!permissions || Object.keys(permissions).length === 0) {
    return false
  }

  // Get permissions for the user's role
  const rolePermissions = permissions[userRole]
  if (!rolePermissions) {
    return false
  }

  // Check if any permission pattern matches the path and method
  return rolePermissions.some((permission) => {
    if (typeof permission === 'string') {
      // Simple path string, allows all methods
      return pathMatchesPattern(path, permission)
    }

    if (typeof permission === 'object' && permission.path && permission.methods) {
      // Permission object with path and methods
      const pathMatches = pathMatchesPattern(path, permission.path)
      if (!pathMatches) {
        return false
      }

      // Check if the method is allowed (case-insensitive)
      return permission.methods.some((allowedMethod: string) => allowedMethod.toUpperCase() === method.toUpperCase())
    }

    return false
  })
}

/**
 * Checks if a path is accessible without authentication
 * @param path - The path being accessed
 * @param whitelist - Array of whitelisted paths
 * @returns true if the path is whitelisted
 */
export const isWhitelisted = (path: string, whitelist: string[]): boolean => {
  return whitelist.some(whitelistedPath => pathMatchesPattern(path, whitelistedPath))
}
