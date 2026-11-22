import { defineEventHandler } from 'h3'
import type { ModuleOptions } from 'nuxt-users/utils'
import { useRuntimeConfig } from '#imports'
import { endSession } from '../../../utils'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  await endSession(event, nuxtUsers as ModuleOptions)
  return { message: 'Logged out successfully' }
})
