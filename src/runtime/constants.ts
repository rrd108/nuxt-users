// Page routes that don't require authentication
export const NO_AUTH_PATHS = ['/login', '/reset-password']

// API routes that don't require authentication (will be prefixed with apiBasePath)
export const NO_AUTH_API_PATHS = ['/session', '/password/forgot', '/password/reset']
