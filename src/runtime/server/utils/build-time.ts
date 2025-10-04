/**
 * Detects if we're running during build/prerendering phase
 * During prerendering, Nuxt starts a temporary server that should not connect to the database
 */
export const isBuildTime = (): boolean => {
  // Check for Nitro prerendering environment variables
  if (process.env.NITRO_PRESET === 'nitro-prerender' || process.env.NUXT_ENV === 'prerender') {
    return true
  }
  
  // Check if we're in a prerendering context
  if (process.env.NODE_ENV === 'production' && process.argv.includes('--prerender')) {
    return true
  }
  
  // Check for common build/prerender indicators
  const buildIndicators = ['prerender', 'build', 'generate']
  return buildIndicators.some(indicator => 
    process.argv.join(' ').toLowerCase().includes(indicator) ||
    process.env.npm_lifecycle_event?.includes(indicator)
  )
}