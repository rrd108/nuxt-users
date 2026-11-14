import { describe, it, expect, afterAll } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { ModuleOptions } from 'nuxt-users/utils'
import {
  dedupeRoutes,
  describeRoute,
  getRouteAccess,
  listFiles,
  pagePathFromFile,
  serverRouteFromFile,
  type RouteEntry
} from '../../src/cli/route-access'

const options = {
  apiBasePath: '/api/nuxt-users',
  passwordResetUrl: '/custom-reset',
  auth: {
    whitelist: ['/about', '/blog/*', '/api/public/**'],
    permissions: {
      admin: ['*'],
      editor: ['/posts/*', { path: '/api/posts', methods: ['GET'] }],
      viewer: [],
    } satisfies ModuleOptions['auth']['permissions'],
  },
}

describe('CLI list-routes: getRouteAccess', () => {
  it('marks built-in public pages, including a custom password reset URL', () => {
    expect(getRouteAccess('/login', 'GET', options)).toEqual({ level: 'public', reason: 'built-in public page', roles: [] })
    expect(getRouteAccess('/reset-password', 'GET', options).level).toBe('public')
    expect(getRouteAccess('/custom-reset', 'GET', options).level).toBe('public')
  })

  it('marks built-in public endpoints only for their methods', () => {
    expect(getRouteAccess('/api/nuxt-users/session', 'POST', options).reason).toBe('built-in public endpoint')
    expect(getRouteAccess('/api/nuxt-users/password/forgot', 'POST', options).level).toBe('public')
    expect(getRouteAccess('/api/nuxt-users/password/forgot', 'GET', options).level).toBe('protected')
  })

  it('reports the whitelist entry that makes a route public', () => {
    expect(getRouteAccess('/about', 'GET', options)).toEqual({ level: 'public', reason: 'whitelist: /about', roles: [] })
    expect(getRouteAccess('/blog/:slug', 'GET', options).reason).toBe('whitelist: /blog/*')
    expect(getRouteAccess('/api/public/a/b', 'POST', options).reason).toBe('whitelist: /api/public/**')
  })

  it('marks endpoints open to every signed-in user', () => {
    expect(getRouteAccess('/api/nuxt-users/me', 'GET', options)).toEqual({ level: 'authenticated', reason: 'any signed-in user', roles: [] })
    expect(getRouteAccess('/api/nuxt-users/password', 'PATCH', options).level).toBe('authenticated')
  })

  it('lists the roles that can reach a protected route, per method', () => {
    expect(getRouteAccess('/posts/1', 'GET', options)).toEqual({ level: 'protected', roles: ['admin', 'editor'] })
    expect(getRouteAccess('/api/posts', 'GET', options).roles).toEqual(['admin', 'editor'])
    expect(getRouteAccess('/api/posts', 'POST', options).roles).toEqual(['admin'])
  })

  it('returns no roles when nobody can reach a route', () => {
    const noPermissions = { ...options, auth: { ...options.auth, permissions: {} } }
    expect(getRouteAccess('/dashboard', 'GET', noPermissions)).toEqual({ level: 'protected', roles: [] })
  })

  it('treats static files outside API routes as public, like the middleware', () => {
    expect(getRouteAccess('/sitemap.xml', 'GET', options).level).toBe('public')
    expect(getRouteAccess('/api/export.csv', 'GET', options).level).toBe('protected')
  })
})

describe('CLI list-routes: describeRoute', () => {
  it('collapses a method-less handler into ANY when every method gets the same access', () => {
    const entries = describeRoute('/about', undefined, 'server/routes/about.ts', options)
    expect(entries).toHaveLength(1)
    expect(entries[0]!.method).toBe('ANY')
  })

  it('splits a method-less handler per method when access differs', () => {
    const entries = describeRoute('/api/posts', undefined, 'server/api/posts.ts', options)
    expect(entries.map(entry => entry.method)).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    expect(entries[0]!.access.roles).toEqual(['admin', 'editor'])
    expect(entries[1]!.access.roles).toEqual(['admin'])
  })
})

describe('CLI list-routes: file to route conversion', () => {
  it('converts page files to route paths', () => {
    expect(pagePathFromFile('index.vue')).toBe('/')
    expect(pagePathFromFile('about.vue')).toBe('/about')
    expect(pagePathFromFile('users/index.vue')).toBe('/users')
    expect(pagePathFromFile('users/[id].vue')).toBe('/users/:id')
    expect(pagePathFromFile('users/[[tab]].vue')).toBe('/users/:tab?')
    expect(pagePathFromFile('docs/[...slug].vue')).toBe('/docs/:slug*')
    expect(pagePathFromFile('(admin)/settings.vue')).toBe('/settings')
    expect(pagePathFromFile('post-[id].client.vue')).toBe('/post-:id')
  })

  it('converts server files to routes and methods', () => {
    expect(serverRouteFromFile('hello.ts', '/api')).toEqual({ path: '/api/hello', method: undefined })
    expect(serverRouteFromFile('index.get.ts', '/api')).toEqual({ path: '/api', method: 'GET' })
    expect(serverRouteFromFile('users/[id].patch.ts', '/api')).toEqual({ path: '/api/users/:id', method: 'PATCH' })
    expect(serverRouteFromFile('files/[...path].ts', '/api')).toEqual({ path: '/api/files/**:path', method: undefined })
    expect(serverRouteFromFile('sitemap.xml.ts', '')).toEqual({ path: '/sitemap.xml', method: undefined })
    expect(serverRouteFromFile('index.ts', '')).toEqual({ path: '/', method: undefined })
    expect(serverRouteFromFile('debug.dev.ts', '')).toEqual({ path: '/debug', method: undefined })
  })
})

describe('CLI list-routes: listFiles and dedupeRoutes', () => {
  const dir = join(tmpdir(), `nuxt-users-list-routes-${process.pid}`)

  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('lists matching files recursively and skips ignored ones', () => {
    mkdirSync(join(dir, 'users'), { recursive: true })
    mkdirSync(join(dir, '-drafts'), { recursive: true })
    for (const file of ['index.vue', 'users/[id].vue', '-hidden.vue', '-drafts/x.vue', 'types.d.ts', 'notes.md']) {
      writeFileSync(join(dir, file), '')
    }
    expect(listFiles(dir, ['.vue', '.ts'])).toEqual(['index.vue', join('users', '[id].vue')])
    expect(listFiles(join(dir, 'missing'), ['.vue'])).toEqual([])
  })

  it('keeps the first entry for a method and path and sorts by path', () => {
    const entry = (method: string, path: string, source: string): RouteEntry => ({ method, path, source, access: { level: 'protected', roles: [] } })
    const result = dedupeRoutes([entry('GET', '/b', 'app'), entry('GET', '/a', 'app'), entry('GET', '/b', 'layer')])
    expect(result.map(e => `${e.path} ${e.source}`)).toEqual(['/a app', '/b app'])
  })
})
