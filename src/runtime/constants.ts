// Cookie holding the OAuth `state` value between the Google redirect and callback (login CSRF protection)
export const OAUTH_STATE_COOKIE = 'nuxt_users_oauth_state'

// *Page routes* that don't require authentication
export const PUBLIC_PAGES = ['/login', '/reset-password']

// *API endpoints* that don't require authentication (relative to apiBasePath)
// These endpoints are accessible without authentication (e.g., password reset flows, login, logout)
export const PUBLIC_API_ENDPOINTS = [
  { path: '/password/forgot', methods: ['POST'] },
  { path: '/password/reset', methods: ['POST'] },
  { path: '/session', methods: ['POST', 'DELETE'] }, // Login and logout endpoints
]

// *API endpoints* auto accessible for *authenticated users* (relative to apiBasePath)
// register, confirm-email are handled automatically when /register is whitelisted
// Google OAuth and passkey login endpoints are handled automatically when they are configured
// A `:id` segment matches a numeric id (see isAuthenticatedAutoAccess)
export const AUTHENTICATED_AUTO_ACCESS_ENDPOINTS = [
  { path: '/me', methods: ['GET', 'PATCH'] },
  { path: '/password', methods: ['PATCH'] },
  // Passkey self-service: a user manages their own passkeys (login endpoints are whitelisted separately)
  { path: '/passkey/register/options', methods: ['POST'] },
  { path: '/passkey/register/verify', methods: ['POST'] },
  { path: '/passkeys', methods: ['GET'] },
  { path: '/passkeys/:id', methods: ['DELETE'] },
]
