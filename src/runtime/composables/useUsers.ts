import { useState, useRuntimeConfig } from '#imports'
import type { User } from '../../types'

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface UsersResponse {
  users: User[]
  pagination: Pagination
}

const usersState = useState<User[]>('users', () => [])
const paginationState = useState<Pagination | null>('users-pagination', () => null)

export const useUsers = () => {
  const { public: { nuxtUsers } } = useRuntimeConfig()
  const loading = useState<boolean>('users-loading', () => false)
  const error = useState<string | null>('users-error', () => null)

  // TODO: later we may want to add a filter parameter,when we do not want to fetch all users, just a subset of them
  const fetchUsers = async (page = 1, limit = 100) => {
    if (loading.value) return
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<UsersResponse>(`${nuxtUsers.apiBasePath}?page=${page}&limit=${limit}`)
      usersState.value = response.users
      paginationState.value = response.pagination
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch users'
      usersState.value = []
      paginationState.value = null
    }
    finally {
      loading.value = false
    }
  }

  const updateUser = (updatedUser: User) => {
    const index = usersState.value.findIndex(u => u.id === updatedUser.id)
    if (index !== -1) {
      usersState.value[index] = updatedUser
    }
  }

  const addUser = (newUser: User) => {
    usersState.value.unshift(newUser)
  }

  const removeUser = async (userId: number) => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${nuxtUsers.apiBasePath}/${userId}`, { method: 'DELETE' })
      usersState.value = usersState.value.filter(u => u.id !== userId)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete user'
    }
    finally {
      loading.value = false
    }
  }

  return {
    users: usersState,
    pagination: paginationState,
    loading,
    error,
    fetchUsers,
    updateUser,
    addUser,
    removeUser
  }
}
