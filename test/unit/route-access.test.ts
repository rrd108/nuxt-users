import { describe, it, expect } from 'vitest'
import { isApiPath, resolveAccess, type RouteAccessConfig } from '../../src/runtime/utils/route-access'

const config: RouteAccessConfig = {
  apiBasePath: '/api/nuxt-users',
  passwordResetUrl: '/custom-reset',
  auth: {
    whitelist: ['/about', '/blog/*', '/api/public/**'],
    permissions: {
      admin: ['*'],
      editor: ['/posts/*', { path: '/api/posts', methods: ['GET'] }],
      viewer: [],
    },
  },
}

const anonymous = null
const admin = { role: 'admin' }
const editor = { role: 'editor' }
const viewer = { role: 'viewer' }
const stranger = { role: 'unknown' }

type Row = [path: string, method: string, user: { role: string } | null, level: string, reason: string | undefined, allowed: boolean]

// Every caller (server middleware, client middleware, usePublicPaths, list-routes) gets these answers
const rows: Row[] = [
  // static files and Nuxt internals, outside API routes only
  ['/favicon.ico', 'GET', anonymous, 'public', 'static file or Nuxt internal', true],
  ['/blog/v1.2/post', 'GET', anonymous, 'public', 'static file or Nuxt internal', true],
  ['/_nuxt/app.js', 'GET', anonymous, 'public', 'static file or Nuxt internal', true],
  ['/api/export.csv', 'GET', anonymous, 'protected', undefined, false],
  ['/api/nuxt-users/me.json', 'GET', anonymous, 'protected', undefined, false],
  ['/api/_internal', 'GET', anonymous, 'protected', undefined, false],

  // built-in public pages and the custom password reset URL
  ['/login', 'GET', anonymous, 'public', 'built-in public page', true],
  ['/reset-password', 'GET', anonymous, 'public', 'built-in public page', true],
  ['/custom-reset', 'GET', anonymous, 'public', 'built-in public page', true],

  // built-in public endpoints, for their methods only
  ['/api/nuxt-users/session', 'POST', anonymous, 'public', 'built-in public endpoint', true],
  ['/api/nuxt-users/session', 'delete', anonymous, 'public', 'built-in public endpoint', true],
  ['/api/nuxt-users/password/forgot', 'POST', anonymous, 'public', 'built-in public endpoint', true],
  ['/api/nuxt-users/password/forgot', 'GET', anonymous, 'protected', undefined, false],

  // whitelist
  ['/about', 'GET', anonymous, 'public', 'whitelist: /about', true],
  ['/blog/:slug', 'GET', anonymous, 'public', 'whitelist: /blog/*', true],
  ['/api/public/a/b', 'POST', anonymous, 'public', 'whitelist: /api/public/**', true],

  // open to every signed-in user, whatever the role
  ['/api/nuxt-users/me', 'GET', anonymous, 'authenticated', 'any signed-in user', false],
  ['/api/nuxt-users/me', 'GET', stranger, 'authenticated', 'any signed-in user', true],
  ['/api/nuxt-users/password', 'PATCH', viewer, 'authenticated', 'any signed-in user', true],
  ['/api/nuxt-users/passkeys/12', 'DELETE', viewer, 'authenticated', 'any signed-in user', true],
  ['/api/nuxt-users/me', 'DELETE', viewer, 'protected', undefined, false],

  // role permissions
  ['/posts/1', 'GET', editor, 'protected', undefined, true],
  ['/posts/1', 'GET', viewer, 'protected', undefined, false],
  ['/api/posts', 'GET', editor, 'protected', undefined, true],
  ['/api/posts', 'POST', editor, 'protected', undefined, false],
  ['/api/posts', 'POST', admin, 'protected', undefined, true],
  ['/dashboard', 'GET', anonymous, 'protected', undefined, false],
  ['/dashboard', 'GET', stranger, 'protected', undefined, false],
  // safe methods pass for any signed-in role, never for anonymous visitors
  ['/dashboard', 'OPTIONS', viewer, 'protected', undefined, true],
  ['/dashboard', 'OPTIONS', anonymous, 'protected', undefined, false],

  // the query string and hash are ignored: a dot there must not make a route look static
  ['/api/nuxt-users?x=.', 'GET', anonymous, 'protected', undefined, false],
  ['/dashboard?file=a.txt', 'GET', anonymous, 'protected', undefined, false],
  ['/login?redirect=/x', 'GET', anonymous, 'public', 'built-in public page', true],
  ['/posts/1#top', 'GET', editor, 'protected', undefined, true],
]

describe('resolveAccess', () => {
  it.each(rows)('%s %s as %o → %s (%s), allowed: %s', (path, method, user, level, reason, allowed) => {
    const decision = resolveAccess(path, method, config, user)
    expect(decision.level).toBe(level)
    expect(decision.reason).toBe(reason)
    expect(decision.allowed).toBe(allowed)
  })

  it('lists the roles that can reach a protected route', () => {
    expect(resolveAccess('/posts/1', 'GET', config).roles).toEqual(['admin', 'editor'])
    expect(resolveAccess('/api/posts', 'POST', config).roles).toEqual(['admin'])
    expect(resolveAccess('/about', 'GET', config).roles).toEqual([])
  })

  it('keeps the default reset page public and adds nothing when passwordResetUrl is the default or missing', () => {
    expect(resolveAccess('/reset-password', 'GET', { ...config, passwordResetUrl: undefined }).allowed).toBe(true)
    expect(resolveAccess('/custom-reset', 'GET', { ...config, passwordResetUrl: undefined }).allowed).toBe(false)
  })

  it('follows a custom apiBasePath, also outside /api/', () => {
    const custom = { ...config, apiBasePath: '/auth' }
    expect(resolveAccess('/auth/session', 'POST', custom).level).toBe('public')
    expect(resolveAccess('/auth/me', 'GET', custom, viewer)).toMatchObject({ level: 'authenticated', allowed: true })
    // the module's endpoints are API routes, so a dot does not make them static
    expect(resolveAccess('/auth/me.json', 'GET', custom).allowed).toBe(false)
    expect(resolveAccess('/api/nuxt-users/session', 'POST', custom).level).toBe('protected')
  })

  it('denies everything role-protected when no permissions are configured', () => {
    const none = { ...config, auth: { whitelist: [] } }
    expect(resolveAccess('/posts/1', 'GET', none, admin).allowed).toBe(false)
    expect(resolveAccess('/api/nuxt-users/me', 'GET', none, admin).allowed).toBe(true)
  })
})

describe('isApiPath', () => {
  it('recognises /api/ routes and the module base path', () => {
    expect(isApiPath('/api/anything')).toBe(true)
    expect(isApiPath('/api/nuxt-users')).toBe(true)
    expect(isApiPath('/auth/me', '/auth')).toBe(true)
    expect(isApiPath('/authors', '/auth')).toBe(false)
    expect(isApiPath('/apiary')).toBe(false)
  })
})
