import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { ModuleOptions } from 'nuxt-users/utils'
import { requireSessionUser } from '../../utils'

export default defineEventHandler(async (event) => {
  const { nuxtUsers } = useRuntimeConfig()
  // Usually answered from the event context, where the authorization middleware left the user
  const user = await requireSessionUser(event, nuxtUsers as ModuleOptions)
  return { user }
})
