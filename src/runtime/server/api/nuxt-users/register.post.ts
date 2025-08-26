import { createError, defineEventHandler, readBody, getHeader } from 'h3'
import { useRuntimeConfig } from '#imports'
import { registerUser } from '../../services/registration'
import type { ModuleOptions } from 'nuxt-users/utils'

export default defineEventHandler(async (event) => {
  try {
    const { nuxtUsers } = useRuntimeConfig()
    const options = nuxtUsers as ModuleOptions
    const body = await readBody(event)
    
    // Validate required fields
    if (!body.email || !body.name || !body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, name, and password are required'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Please provide a valid email address'
      })
    }

    // Validate name length
    if (body.name.trim().length < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name cannot be empty'
      })
    }

    // Get the base URL for email links
    const host = getHeader(event, 'host') || 'localhost:3000'
    const protocol = getHeader(event, 'x-forwarded-proto') || 'http'
    const baseUrl = `${protocol}://${host}`

    const result = await registerUser(
      {
        email: body.email.toLowerCase().trim(),
        name: body.name.trim(),
        password: body.password
      },
      options,
      baseUrl
    )

    return result
  } catch (error) {
    console.error('[Nuxt Users] Registration error:', error)
    
    if (error instanceof Error) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Registration failed'
    })
  }
})
