import { getHeader, type H3Event } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'

export const SITE_URL_REQUIRED_MESSAGE = '[Nuxt Users] siteUrl is not configured. Set nuxtUsers.siteUrl (or NUXT_NUXT_USERS_SITE_URL) to your public app URL, e.g. https://example.com, so email links are not built from the untrusted Host header.'

/**
 * Resolves the base URL used for links in emails (password reset, email confirmation).
 *
 * The request's Host / X-Forwarded-Proto headers are attacker-controlled, so they are only
 * used as a fallback outside production. In production `siteUrl` must be configured.
 */
export const getSiteUrl = (event: H3Event, options: ModuleOptions): string => {
  if (options.siteUrl) {
    return options.siteUrl.replace(/\/+$/, '')
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(SITE_URL_REQUIRED_MESSAGE)
  }

  const host = getHeader(event, 'host') || 'localhost:3000'
  const protocol = getHeader(event, 'x-forwarded-proto') || 'http'
  return `${protocol}://${host}`
}
