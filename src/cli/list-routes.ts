import { defineCommand } from 'citty'
import { join, relative, resolve } from 'node:path'
import type { ModuleOptions } from 'nuxt-users/utils'
import { dedupeRoutes, describeRoute, listFiles, pagePathFromFile, serverRouteFromFile } from './route-access'
import type { RouteEntry, RouteListing } from './route-access'

const PAGE_EXTENSIONS = ['.vue', '.tsx', '.jsx', '.ts', '.js', '.mjs']
const SERVER_EXTENSIONS = ['.ts', '.js', '.mjs', '.mts', '.cjs', '.cts']

interface ProjectConfig {
  rootDir?: string
  srcDir?: string
  serverDir?: string
  dir?: { pages?: string }
}

interface ServerHandler {
  route?: string
  method?: string
  middleware?: boolean
}

/** The parts of the loaded Nuxt instance this command reads (the full `Nuxt` type is too deep for the type checker) */
interface NuxtProject {
  options: ProjectConfig & {
    rootDir: string
    pages?: boolean | object
    _layers: { cwd: string, config: ProjectConfig }[]
    serverHandlers?: ServerHandler[]
    nitro?: { handlers?: ServerHandler[], apiBaseURL?: string }
    runtimeConfig?: { nuxtUsers?: unknown }
  }
  close: () => Promise<void>
}

interface LayerDirs {
  root: string
  pages: string
  server: string
}

/** Pages and server directories of every layer, the app first (same resolution as `getLayerDirectories` in @nuxt/kit) */
const getLayerDirs = (nuxt: NuxtProject): LayerDirs[] => nuxt.options._layers.map((layer) => {
  const isApp = resolve(layer.config.rootDir || layer.cwd) === resolve(nuxt.options.rootDir)
  const config = isApp ? nuxt.options : layer.config
  const srcDir = config.srcDir || layer.cwd
  return {
    root: config.rootDir || layer.cwd,
    pages: resolve(srcDir, config.dir?.pages || 'pages'),
    server: resolve(srcDir, config.serverDir || 'server'),
  }
})

export const collectRoutes = (nuxt: NuxtProject, options: ModuleOptions): RouteListing => {
  const rootDir = nuxt.options.rootDir
  const layers = getLayerDirs(nuxt)
  const pages: RouteEntry[] = []
  const endpoints: RouteEntry[] = []

  if (nuxt.options.pages !== false) {
    for (const layer of layers) {
      for (const file of listFiles(layer.pages, PAGE_EXTENSIONS)) {
        pages.push(...describeRoute(pagePathFromFile(file), 'GET', relative(rootDir, join(layer.pages, file)), options))
      }
    }
  }

  // Handlers registered by modules (including nuxt-users itself) and through `nitro.handlers`
  const handlers = [...(nuxt.options.serverHandlers || []), ...(nuxt.options.nitro?.handlers || [])]
  for (const handler of handlers) {
    // Nuxt internals (e.g. `/__nuxt_island/**`) are skipped by the auth middleware and are not part of the app
    if (handler.middleware || !handler.route || handler.route.startsWith('/_')) continue
    endpoints.push(...describeRoute(handler.route, handler.method, 'module', options))
  }

  // File-based server routes of every layer
  const apiPrefix = nuxt.options.nitro?.apiBaseURL || '/api'
  for (const layer of layers) {
    for (const [dir, prefix] of [['api', apiPrefix], ['routes', '']] as const) {
      const fullDir = join(layer.server, dir)
      for (const file of listFiles(fullDir, SERVER_EXTENSIONS)) {
        const { path, method } = serverRouteFromFile(file, prefix)
        endpoints.push(...describeRoute(path, method, relative(rootDir, join(fullDir, file)), options))
      }
    }
  }

  return { pages: dedupeRoutes(pages), endpoints: dedupeRoutes(endpoints) }
}

const LEVEL_LABELS = {
  public: 'public',
  authenticated: 'signed-in',
  protected: 'protected',
} as const

const describeAccess = (entry: RouteEntry) => {
  if (entry.access.level !== 'protected') return entry.access.reason || ''
  return entry.access.roles.length > 0 ? `roles: ${entry.access.roles.join(', ')}` : '⚠️  no role has access'
}

const printSection = (title: string, entries: RouteEntry[], showMethod: boolean) => {
  console.log(`[Nuxt Users] ${title} (${entries.length})`)
  if (entries.length === 0) {
    console.log('[Nuxt Users]    none found')
    console.log()
    return
  }
  const methodWidth = Math.max(...entries.map(entry => entry.method.length))
  const pathWidth = Math.max(...entries.map(entry => entry.path.length))
  for (const entry of entries) {
    const level = LEVEL_LABELS[entry.access.level].padEnd(10)
    const method = showMethod ? `${entry.method.padEnd(methodWidth)}  ` : ''
    console.log(`[Nuxt Users]    ${level} ${method}${entry.path.padEnd(pathWidth)}  ${describeAccess(entry)}`)
  }
  console.log()
}

const printSummary = (listing: RouteListing) => {
  const all = [...listing.pages, ...listing.endpoints]
  const count = (predicate: (entry: RouteEntry) => boolean) => all.filter(predicate).length
  console.log('[Nuxt Users] Summary:')
  console.log('[Nuxt Users]    public:', count(entry => entry.access.level === 'public'))
  console.log('[Nuxt Users]    any signed-in user:', count(entry => entry.access.level === 'authenticated'))
  console.log('[Nuxt Users]    role protected:', count(entry => entry.access.level === 'protected' && entry.access.roles.length > 0))
  const unreachable = count(entry => entry.access.level === 'protected' && entry.access.roles.length === 0)
  console.log('[Nuxt Users]    no role has access:', unreachable)
  if (unreachable > 0) {
    console.log('[Nuxt Users]    ➡️  Add them to auth.whitelist or auth.permissions if they should be reachable')
  }
}

export default defineCommand({
  meta: {
    name: 'list-routes',
    description: 'List the pages and API endpoints of the Nuxt project and who can access them (public, any signed-in user or which roles)'
  },
  args: {
    json: {
      type: 'boolean',
      description: 'Print the result as JSON',
      default: false
    }
  },
  async run({ args }) {
    const json = Boolean(args.json)
    // In JSON mode keep stdout clean: messages logged while Nuxt and its modules load go to stderr
    const originalLog = console.log
    if (json) {
      console.log = console.error
    }

    let nuxt: NuxtProject | undefined
    try {
      const { loadNuxt } = await import('@nuxt/kit')
      console.log('[Nuxt Users] Loading Nuxt project...')
      nuxt = await loadNuxt({ cwd: process.cwd() }) as unknown as NuxtProject

      const options = nuxt.options.runtimeConfig?.nuxtUsers as ModuleOptions | undefined
      if (!options?.auth) {
        console.error('[Nuxt Users] ❌ Nuxt Users module is not configured in this project')
        process.exitCode = 1
        return
      }

      const listing = collectRoutes(nuxt, options)
      console.log = originalLog

      if (json) {
        console.log(JSON.stringify(listing, null, 2))
        return
      }

      console.log()
      printSection('Pages', listing.pages, false)
      printSection('API endpoints', listing.endpoints, true)
      printSummary(listing)
    }
    catch (error) {
      console.error('[Nuxt Users] ❌ Could not list routes:', error)
      process.exitCode = 1
    }
    finally {
      console.log = originalLog
      await nuxt?.close()
    }
  }
})
