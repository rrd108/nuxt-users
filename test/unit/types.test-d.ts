
import { assertType, expectTypeOf } from 'vitest'
import type { ModuleOptions, User, UserWithoutPassword, RuntimeModuleOptions } from '../../src/types'
import { useAuthentication } from '../../src/runtime/composables/useAuthentication'
import { useUsers } from '../../src/runtime/composables/useUsers'

describe('Type Definitions', () => {
  it('should maintain the public API of ModuleOptions', () => {
    expectTypeOf<ModuleOptions>().toHaveProperty('connector')
    expectTypeOf<ModuleOptions>().toHaveProperty('apiBasePath')
    expectTypeOf<ModuleOptions>().toHaveProperty('tables')
    expectTypeOf<ModuleOptions>().toHaveProperty('mailer')
    expectTypeOf<ModuleOptions>().toHaveProperty('passwordResetUrl')
    expectTypeOf<ModuleOptions>().toHaveProperty('emailConfirmationUrl')
    expectTypeOf<ModuleOptions>().toHaveProperty('auth')
    expectTypeOf<ModuleOptions>().toHaveProperty('passwordValidation')
    expectTypeOf<ModuleOptions>().toHaveProperty('hardDelete')
    expectTypeOf<ModuleOptions>().toHaveProperty('locale')
  })

  it('should maintain the public API of RuntimeModuleOptions', () => {
    expectTypeOf<RuntimeModuleOptions>().toHaveProperty('connector')
    expectTypeOf<RuntimeModuleOptions>().toHaveProperty('apiBasePath')
    expectTypeOf<RuntimeModuleOptions>().toHaveProperty('tables')
    expectTypeOf<RuntimeModuleOptions>().toHaveProperty('mailer')
    expectTypeOf<RuntimeModuleOptions>().toHaveProperty('passwordResetUrl')
    expectTypeOf<RuntimeModuleOptions>().toHaveProperty('emailConfirmationUrl')
    expectTypeOf<RuntimeModuleOptions>().toHaveProperty('auth')
    expectTypeOf<RuntimeModuleOptions>().toHaveProperty('passwordValidation')
    expectTypeOf<RuntimeModuleOptions>().toHaveProperty('hardDelete')
    expectTypeOf<RuntimeModuleOptions>().toHaveProperty('locale')
  })

  it('should define User and UserWithoutPassword correctly', () => {
    expectTypeOf<User>().toHaveProperty('id')
    expectTypeOf<User>().toHaveProperty('email')
    expectTypeOf<User>().toHaveProperty('password')

    expectTypeOf<UserWithoutPassword>().toHaveProperty('id')
    expectTypeOf<UserWithoutPassword>().toHaveProperty('email')
    expectTypeOf<UserWithoutPassword>().not.toHaveProperty('password')
  })

  it('should maintain the return type of useAuthentication', () => {
    const auth = useAuthentication()
    expectTypeOf(auth).toHaveProperty('user')
    expectTypeOf(auth).toHaveProperty('isAuthenticated')
    expectTypeOf(auth).toHaveProperty('login')
    expectTypeOf(auth).toHaveProperty('logout')
    expectTypeOf(auth).toHaveProperty('fetchUser')
    expectTypeOf(auth).toHaveProperty('initializeUser')

    assertType<((userData: User, rememberMe?: boolean) => void)>(auth.login)
  })

  it('should maintain the return type of useUsers', () => {
    const users = useUsers()
    expectTypeOf(users).toHaveProperty('users')
    expectTypeOf(users).toHaveProperty('pagination')
    expectTypeOf(users).toHaveProperty('loading')
    expectTypeOf(users).toHaveProperty('error')
    expectTypeOf(users).toHaveProperty('fetchUsers')
    expectTypeOf(users).toHaveProperty('updateUser')
    expectTypeOf(users).toHaveProperty('addUser')
    expectTypeOf(users).toHaveProperty('removeUser')

    assertType<((page?: number, limit?: number) => Promise<void>)>(users.fetchUsers)
    assertType<((updatedUser: User) => void)>(users.updateUser)
    assertType<((newUser: User) => void)>(users.addUser)
    assertType<((userId: number) => Promise<void>)>(users.removeUser)
  })
})
