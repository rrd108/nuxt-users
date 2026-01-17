import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUsers } from '../../src/runtime/composables/useUsers'
import type { User } from '../../src/types'

// Mock state storage
const { mockState } = vi.hoisted(() => ({
  mockState: new Map()
}))

// Mock #imports
vi.mock('#imports', () => ({
  useState: (key: string, init: () => unknown) => {
    if (!mockState.has(key)) {
      mockState.set(key, { value: init ? init() : undefined })
    }
    return mockState.get(key)
  },
  useRuntimeConfig: () => ({
    public: {
      nuxtUsers: {
        apiBasePath: '/api/nuxt-users'
      }
    }
  })
}))

// Mock global $fetch
const mockFetch = vi.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.$fetch = mockFetch as any

describe('useUsers Composable', () => {
  beforeEach(() => {
    mockState.clear()
    vi.clearAllMocks()
  })

  it('should initialize with default states', () => {
    const { users, pagination, loading, error } = useUsers()

    expect(users.value).toEqual([])
    expect(pagination.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  describe('fetchUsers', () => {
    it('should fetch users successfully', async () => {
      const mockResponse = {
        users: [{ id: 1, name: 'User 1' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      }
      mockFetch.mockResolvedValue(mockResponse)

      const { fetchUsers, users, pagination, loading, error } = useUsers()

      const promise = fetchUsers(1, 10)
      expect(loading.value).toBe(true)

      await promise

      expect(mockFetch).toHaveBeenCalledWith('/api/nuxt-users?page=1&limit=10')
      expect(users.value).toEqual(mockResponse.users)
      expect(pagination.value).toEqual(mockResponse.pagination)
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { fetchUsers, users, pagination, loading, error } = useUsers()

      await fetchUsers()

      expect(users.value).toEqual([])
      expect(pagination.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(error.value).toBe('Network error')
    })

    it('should not fetch if already loading', async () => {
      const { fetchUsers, loading } = useUsers()
      loading.value = true

      await fetchUsers()

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('updateUser', () => {
    it('should update existing user in state', () => {
      const { updateUser, users } = useUsers()

      // Setup initial state
      users.value = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ] as User[]

      updateUser({ id: 1, name: 'Updated User 1' } as User)

      expect(users.value[0].name).toBe('Updated User 1')
      expect(users.value[1].name).toBe('User 2')
    })

    it('should ignore updates for non-existent user', () => {
      const { updateUser, users } = useUsers()

      users.value = [{ id: 1, name: 'User 1' }] as User[]

      updateUser({ id: 999, name: 'New User' } as User)

      expect(users.value).toHaveLength(1)
      expect(users.value[0].name).toBe('User 1')
    })
  })

  describe('addUser', () => {
    it('should add user to the beginning of the list', () => {
      const { addUser, users } = useUsers()

      users.value = [{ id: 1, name: 'User 1' }] as User[]

      addUser({ id: 2, name: 'User 2' } as User)

      expect(users.value).toHaveLength(2)
      expect(users.value[0].name).toBe('User 2')
      expect(users.value[1].name).toBe('User 1')
    })
  })

  describe('removeUser', () => {
    it('should remove user successfully', async () => {
      const { removeUser, users, loading, error } = useUsers()

      users.value = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ] as User[]

      mockFetch.mockResolvedValue({})

      const promise = removeUser(1)
      expect(loading.value).toBe(true)

      await promise

      expect(mockFetch).toHaveBeenCalledWith('/api/nuxt-users/1', { method: 'DELETE' })
      expect(users.value).toHaveLength(1)
      expect(users.value[0].id).toBe(2)
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should handle remove errors', async () => {
      const { removeUser, users, loading, error } = useUsers()

      users.value = [{ id: 1, name: 'User 1' }] as User[]

      mockFetch.mockRejectedValue(new Error('Delete failed'))

      await removeUser(1)

      expect(users.value).toHaveLength(1) // Should not remove on error
      expect(loading.value).toBe(false)
      expect(error.value).toBe('Delete failed')
    })
  })
})
