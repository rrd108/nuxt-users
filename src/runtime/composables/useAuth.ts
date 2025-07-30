import { useState } from '#app'
import type { User } from '../../types'

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)

  return {
    user,
  }
}
