import { AUTHENTICATED_AUTO_ACCESS_ENDPOINTS } from '../constants'

/**
 * Whether a request targets one of the endpoints every signed-in user may call, whatever their role.
 * A `:id` segment in the endpoint path stands for a numeric id; the literal `:id` also matches,
 * so route patterns (as shown by `nuxt-users list-routes`) resolve the same way as real requests.
 * Shared by the server authorization middleware and the route listing, so they cannot drift.
 */
export const isAuthenticatedAutoAccess = (path: string, method: string, base: string): boolean => {
  return AUTHENTICATED_AUTO_ACCESS_ENDPOINTS.some((endpoint) => {
    if (!endpoint.methods.includes(method.toUpperCase())) {
      return false
    }
    const expected = `${base}${endpoint.path}`.split('/')
    const actual = path.split('/')
    return expected.length === actual.length && expected.every((segment, index) => {
      return segment === actual[index] || (segment === ':id' && /^(?:\d+|:id)$/.test(actual[index]!))
    })
  })
}
