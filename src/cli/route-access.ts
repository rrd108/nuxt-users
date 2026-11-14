import { existsSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { ModuleOptions } from 'nuxt-users/utils'
import { PUBLIC_PAGES, PUBLIC_API_ENDPOINTS, AUTHENTICATED_AUTO_ACCESS_ENDPOINTS } from '../runtime/constants'
import { hasPermission, pathMatchesPattern } from '../runtime/utils/permissions'

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

export interface RouteEntry {
  /** HTTP method, or `ANY` when every method gets the same access */
  method: string
  path: string
  /** `module` for handlers registered by Nuxt modules, otherwise the file path relative to the project root */
  source: string
  access: RouteAccess
}

export interface RouteListing {
  pages: RouteEntry[]
  endpoints: RouteEntry[]
}

/** Methods checked for handlers that do not declare one */
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const NITRO_METHOD_SUFFIX = /\.(get|post|put|patch|delete|head|options|connect|trace)$/i
const ENV_SUFFIX = /\.(dev|prod|prerender)$/
const MODE_SUFFIX = /\.(client|server)$/

type AccessOptions = Pick<ModuleOptions, 'apiBasePath' | 'passwordResetUrl'> & {
  auth: Pick<ModuleOptions['auth'], 'whitelist' | 'permissions'>
}

/**
 * Tells who can reach a path, following the same order of checks as the server authorization middleware.
 * Pass the merged runtime config: its whitelist already contains the auto-added registration and OAuth endpoints.
 */
export const getRouteAccess = (path: string, method: string, options: AccessOptions): RouteAccess => {
  const base = options.apiBasePath || '/api/nuxt-users'
  const isApiRoute = path.startsWith('/api/') || path === base || path.startsWith(`${base}/`)
  const lastSegment = path.split('/').pop() || ''

  // The middleware skips static files and Nuxt internals (only outside API routes)
  if (!isApiRoute && (lastSegment.includes('.') || path.startsWith('/_'))) {
    return { level: 'public', reason: 'static file or Nuxt internal', roles: [] }
  }

  const publicPages = [...PUBLIC_PAGES]
  if (options.passwordResetUrl && options.passwordResetUrl !== '/reset-password') {
    publicPages.push(options.passwordResetUrl)
  }
  if (publicPages.includes(path)) {
    return { level: 'public', reason: 'built-in public page', roles: [] }
  }

  if (PUBLIC_API_ENDPOINTS.some(endpoint => path === `${base}${endpoint.path}` && endpoint.methods.includes(method))) {
    return { level: 'public', reason: 'built-in public endpoint', roles: [] }
  }

  const whitelistEntry = (options.auth.whitelist || []).find(pattern => pathMatchesPattern(path, pattern))
  if (whitelistEntry) {
    return { level: 'public', reason: `whitelist: ${whitelistEntry}`, roles: [] }
  }

  if (AUTHENTICATED_AUTO_ACCESS_ENDPOINTS.some(endpoint => path === `${base}${endpoint.path}` && endpoint.methods.includes(method))) {
    return { level: 'authenticated', reason: 'any signed-in user', roles: [] }
  }

  const permissions = options.auth.permissions || {}
  const roles = Object.keys(permissions).filter(role => hasPermission(role, path, method, permissions))
  return { level: 'protected', roles }
}

/**
 * Builds the entries for one route. A handler without a method is checked for every method:
 * one `ANY` entry when they all get the same access, otherwise one entry per method.
 */
export const describeRoute = (path: string, method: string | undefined, source: string, options: AccessOptions): RouteEntry[] => {
  if (method) {
    const upper = method.toUpperCase()
    return [{ method: upper, path, source, access: getRouteAccess(path, upper, options) }]
  }

  const perMethod = HTTP_METHODS.map(m => ({ method: m, path, source, access: getRouteAccess(path, m, options) }))
  const first = JSON.stringify(perMethod[0]!.access)
  if (perMethod.every(entry => JSON.stringify(entry.access) === first)) {
    return [{ ...perMethod[0]!, method: 'ANY' }]
  }
  return perMethod
}

const stripExtension = (file: string) => file.replace(/\.[^./]+$/, '')

/** Turns a file-name token like `[id]`, `[[id]]` or `[...slug]` into a route segment */
const convertSegment = (segment: string, style: 'page' | 'nitro') => segment.replace(
  /\[\[([^\]]+)\]\]|\[\.\.\.([^\]]*)\]|\[([^\]]+)\]/g,
  (_match, optional: string | undefined, catchAll: string | undefined, param: string | undefined) => {
    if (optional !== undefined) return `:${optional}?`
    if (catchAll !== undefined) {
      if (style === 'nitro') return catchAll ? `**:${catchAll}` : '**'
      return `:${catchAll || 'slug'}*`
    }
    return `:${param}`
  }
)

const segmentsToPath = (segments: string[], style: 'page' | 'nitro') => {
  const parts = segments
    .filter(segment => !/^\(.*\)$/.test(segment)) // route groups like `(admin)` do not appear in the URL
    .map(segment => convertSegment(segment, style))
  if (parts[parts.length - 1] === 'index') {
    parts.pop()
  }
  return `/${parts.join('/')}`
}

/** Route path of a file in the pages directory, e.g. `users/[id].vue` → `/users/:id` */
export const pagePathFromFile = (relativeFile: string): string => {
  const withoutExtension = stripExtension(relativeFile.split(sep).join('/')).replace(MODE_SUFFIX, '')
  return segmentsToPath(withoutExtension.split('/'), 'page')
}

/** Route and method of a Nitro server file, e.g. `users/[id].get.ts` in `server/api` → `/api/users/:id` GET */
export const serverRouteFromFile = (relativeFile: string, prefix: string): { path: string, method?: string } => {
  let name = stripExtension(relativeFile.split(sep).join('/')).replace(ENV_SUFFIX, '')
  let method: string | undefined
  const methodMatch = name.match(NITRO_METHOD_SUFFIX)
  if (methodMatch) {
    method = methodMatch[1]!.toUpperCase()
    name = name.slice(0, -methodMatch[0].length)
  }
  const routePath = segmentsToPath(name.split('/'), 'nitro')
  const path = `${prefix.replace(/\/$/, '')}${routePath === '/' ? '' : routePath}` || '/'
  return { path, method }
}

/**
 * Lists the files in a directory recursively, relative to it, skipping
 * entries starting with `-` (Nuxt's ignore prefix) or `.`, and type declarations.
 */
export const listFiles = (dir: string, extensions: string[]): string[] => {
  if (!existsSync(dir)) {
    return []
  }
  const files: string[] = []
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('-') || entry.name.startsWith('.')) continue
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (entry.name.endsWith('.d.ts')) continue
      if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(relative(dir, full))
      }
    }
  }
  walk(dir)
  return files.sort()
}

const compareEntries = (a: RouteEntry, b: RouteEntry) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)

/** Removes duplicate method + path pairs (the first one wins, e.g. a layer overridden by the app) and sorts by path */
export const dedupeRoutes = (entries: RouteEntry[]): RouteEntry[] => {
  const seen = new Set<string>()
  return entries
    .filter((entry) => {
      const key = `${entry.method} ${entry.path}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort(compareEntries)
}
