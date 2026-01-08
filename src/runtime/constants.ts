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
// Google OAuth endpoints are handled automatically when Google OAuth is configured
export const AUTHENTICATED_AUTO_ACCESS_ENDPOINTS = [
  { path: '/me', methods: ['GET', 'PATCH'] },
  { path: '/password', methods: ['PATCH'] },
]
