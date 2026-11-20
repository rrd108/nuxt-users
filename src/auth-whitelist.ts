export interface AuthWhitelistInput {
  /** Whitelist from defaults and the user's config */
  whitelist: string[]
  apiBasePath: string
  /** Google OAuth is configured */
  google?: boolean
  /** Passkey login is configured */
  passkey?: boolean
}

/**
 * The auth whitelist with the endpoints that must be reachable without a session added automatically:
 * registration (when /register is whitelisted), Google OAuth and passkey login.
 * The passkey management and registration endpoints are deliberately not here: they need a session.
 * Used for both the private and the public runtime config, so the two cannot drift.
 */
export const computeAuthWhitelist = ({ whitelist, apiBasePath, google, passkey }: AuthWhitelistInput): string[] => {
  const combined = [...whitelist]
  const add = (endpoints: string[]) => {
    for (const endpoint of endpoints) {
      if (!combined.includes(endpoint)) {
        combined.push(endpoint)
      }
    }
  }

  if (combined.includes('/register')) {
    add([
      '/confirm-email', // Page route for email confirmation
      `${apiBasePath}/register`, // API endpoint for registration
      `${apiBasePath}/confirm-email`, // API endpoint for email confirmation
    ])
  }
  if (google) {
    add([`${apiBasePath}/auth/google/redirect`, `${apiBasePath}/auth/google/callback`])
  }
  if (passkey) {
    add([`${apiBasePath}/passkey/login/options`, `${apiBasePath}/passkey/login/verify`])
  }

  return combined
}
