import type { NitroAppPlugin } from 'nitropack'
import { useRuntimeConfig } from '#imports'
import type { ModuleOptions } from 'nuxt-users/utils'

const INSECURE_DEFAULT_FROM = /@example\.com>/i
const DEFAULT_ETHEREAL_HOST = 'smtp.ethereal.email'
const isTestEnvironment = (): boolean => process.env.NODE_ENV === 'test' || !!process.env.VITEST

const validateMailerConfig = (options: ModuleOptions): void => {
  // Guard: integration tests can boot without email delivery configured.
  if (isTestEnvironment()) {
    return
  }

  const mailer = options.mailer
  if (!mailer?.host || !mailer?.auth?.user || !mailer?.auth?.pass) {
    return
  }

  const from = mailer.defaults?.from || '"Nuxt Users" <noreply@example.com>'
  if (!INSECURE_DEFAULT_FROM.test(from)) {
    return
  }

  const isCustomMailer = mailer.host !== DEFAULT_ETHEREAL_HOST
  if (!isCustomMailer) {
    return
  }

  throw new Error(
    '[Nuxt Users] Invalid mailer config: mailer.defaults.from must be set to a valid sender address when using a custom SMTP host. '
    + 'Using noreply@example.com causes password reset emails to bounce (DMARC rejection). '
    + 'Set nuxtUsers.mailer.defaults.from in nuxt.config.ts or NUXT_NUXT_USERS_MAILER_DEFAULTS_FROM env var, e.g. "App" <noreply@yourdomain.com>'
  )
}

const plugin: NitroAppPlugin = () => {
  const config = useRuntimeConfig()
  const options = config.nuxtUsers as ModuleOptions | undefined
  if (!options) {
    return
  }
  validateMailerConfig(options)
}

export default plugin
