import type { Permission } from '../types'

export const MAX_ROLE_LENGTH = 32

export type RoleValidationOptions = {
  permissions?: Record<string, (string | Permission)[]>
  allowCustomRoles?: boolean
}

/**
 * Returns role names defined in auth.permissions (the predefined role catalog).
 */
export const getAvailableRoles = (
  permissions?: Record<string, (string | Permission)[]>
): string[] => {
  if (!permissions) {
    return []
  }
  return Object.keys(permissions)
}

/**
 * Validates a role against permissions and allowCustomRoles.
 * - Empty permissions: any non-empty role is allowed (bootstrap before RBAC is configured)
 * - allowCustomRoles true: any non-empty role is allowed
 * - otherwise: role must be a key of permissions
 */
export const isValidRole = (
  role: string | undefined | null,
  options: RoleValidationOptions = {}
): boolean => {
  if (role === undefined || role === null) {
    return false
  }

  const trimmed = typeof role === 'string' ? role.trim() : ''
  if (!trimmed) {
    return false
  }

  if (trimmed.length > MAX_ROLE_LENGTH) {
    return false
  }

  if (options.allowCustomRoles) {
    return true
  }

  const availableRoles = getAvailableRoles(options.permissions)
  if (availableRoles.length === 0) {
    return true
  }

  return availableRoles.includes(trimmed)
}

/**
 * Asserts role is valid or throws with a clear error message.
 * Returns the trimmed role string.
 */
export const assertValidRole = (
  role: string | undefined | null,
  options: RoleValidationOptions = {}
): string => {
  if (role === undefined || role === null || typeof role !== 'string') {
    throw new Error('Role is required')
  }

  const trimmed = role.trim()
  if (!trimmed) {
    throw new Error('Role is required')
  }

  if (trimmed.length > MAX_ROLE_LENGTH) {
    throw new Error(`Role must be at most ${MAX_ROLE_LENGTH} characters`)
  }

  if (isValidRole(trimmed, options)) {
    return trimmed
  }

  const availableRoles = getAvailableRoles(options.permissions)
  throw new Error(
    `Invalid role "${trimmed}". Allowed roles: ${availableRoles.join(', ')}`
  )
}
