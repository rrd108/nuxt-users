import type { Permission } from './imports'
import { PUBLIC_PAGES, PUBLIC_API_ENDPOINTS } from '../constants'
import { isAuthenticatedAutoAccess } from './auto-access'
import { hasPermission, pathMatchesPattern } from './permissions'

/**
 * - `public`: reachable without signing in
 * - `authenticated`: any signed-in user, whatever their role
 * - `protected`: only the roles listed in `roles` (none means nobody can reach it)
 */
export type AccessLevel = 'public' | 'authenticated' | 'protected'

export interface RouteAccess {
  level: AccessLevel
  /** Why the route is public or open to every signed-in user */
  reason?: string
  /** Roles from `auth.permissions` that can reach a protected route */
  roles: string[]
}

export interface AccessDecision extends RouteAccess {
  /** Whether the given user (or an anonymous visitor, when no user is given) may reach the route */
  allowed: boolean
}

/**
 * The config the decision depends on. Both the private and the public runtime config satisfy it:
 * their whitelist already contains the auto-added registration, OAuth and passkey endpoints.
 */
export interface RouteAccessConfig {
  apiBasePath?: string
  passwordResetUrl?: string
  auth?: {
    whitelist?: string[]
    permissions?: Record<string, (string | Permission)[]>
  }
}

const DEFAULT_API_BASE_PATH = '/api/nuxt-users'
const DEFAULT_PASSWORD_RESET_URL = '/reset-password'

/** The pathname only: routing ignores the query string and hash, so access checks must too */
const toPathname = (path: string) => path.split(/[?#]/)[0] || '/'

/** API routes are never treated as static files or Nuxt internals, even with a dot in the path */
export const isApiPath = (path: string, apiBasePath: string = DEFAULT_API_BASE_PATH): boolean => {
  const pathname = toPathname(path)
  return pathname.startsWith('/api/') || pathname === apiBasePath || pathname.startsWith(`${apiBasePath}/`)
}

/**
 * Who may reach a path, whoever is asking. The checks run in this order:
 * static files and Nuxt internals (outside API routes), built-in public pages and the custom password reset URL,
 * built-in public API endpoints, the whitelist, endpoints open to every signed-in user, and finally role permissions.
 */
export const getRouteAccess = (path: string, method: string, config: RouteAccessConfig): RouteAccess => {
  const pathname = toPathname(path)
  const upperMethod = method.toUpperCase()
  const base = config.apiBasePath || DEFAULT_API_BASE_PATH

  if (!isApiPath(pathname, base) && (pathname.includes('.') || pathname.startsWith('/_'))) {
    return { level: 'public', reason: 'static file or Nuxt internal', roles: [] }
  }

  const resetUrl = config.passwordResetUrl
  if (PUBLIC_PAGES.includes(pathname) || (resetUrl && resetUrl !== DEFAULT_PASSWORD_RESET_URL && pathname === resetUrl)) {
    return { level: 'public', reason: 'built-in public page', roles: [] }
  }

  if (PUBLIC_API_ENDPOINTS.some(endpoint => pathname === `${base}${endpoint.path}` && endpoint.methods.includes(upperMethod))) {
    return { level: 'public', reason: 'built-in public endpoint', roles: [] }
  }

  const whitelistEntry = (config.auth?.whitelist || []).find(pattern => pathMatchesPattern(pathname, pattern))
  if (whitelistEntry) {
    return { level: 'public', reason: `whitelist: ${whitelistEntry}`, roles: [] }
  }

  if (isAuthenticatedAutoAccess(pathname, upperMethod, base)) {
    return { level: 'authenticated', reason: 'any signed-in user', roles: [] }
  }

  const permissions = config.auth?.permissions || {}
  const roles = Object.keys(permissions).filter(role => hasPermission(role, pathname, upperMethod, permissions))
  return { level: 'protected', roles }
}

/**
 * The single answer to "may this visitor reach this path?", shared by the server middleware,
 * the client route middleware, `usePublicPaths` and `nuxt-users list-routes`.
 * Without a user it answers for an anonymous visitor; with one it also applies role permissions.
 */
export const resolveAccess = (
  path: string,
  method: string,
  config: RouteAccessConfig,
  user?: { role: string } | null
): AccessDecision => {
  const access = getRouteAccess(path, method, config)
  if (access.level === 'public') {
    return { ...access, allowed: true }
  }
  if (!user) {
    return { ...access, allowed: false }
  }
  if (access.level === 'authenticated') {
    return { ...access, allowed: true }
  }
  // hasPermission rather than `roles`: it also lets safe methods (OPTIONS, HEAD, TRACE) through for any role
  return { ...access, allowed: hasPermission(user.role, toPathname(path), method.toUpperCase(), config.auth?.permissions || {}) }
}
