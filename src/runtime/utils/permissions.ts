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
    const regex = new RegExp(`^${regexPattern}$`)
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
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(path)
  }

  return false
}

/**
 * Checks if a user has permission to access a specific path
 * @param userRole - The user's role
 * @param path - The path being accessed
 * @param permissions - The permissions configuration
 * @returns true if the user has permission to access the path
 */
export const hasPermission = (
  userRole: string,
  path: string,
  permissions: Record<string, string[]>
): boolean => {
  // If no permissions are configured, deny access (whitelist approach)
  if (!permissions || Object.keys(permissions).length === 0) {
    return false
  }

  // Get permissions for the user's role
  const rolePermissions = permissions[userRole]
  if (!rolePermissions) {
    return false
  }

  // Check if any permission pattern matches the path
  return rolePermissions.some(pattern => pathMatchesPattern(path, pattern))
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
