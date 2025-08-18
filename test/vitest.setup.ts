import { afterEach } from 'vitest'
import { closeAllDbConnections } from '../src/runtime/server/utils/db'

afterEach(async () => {
  await closeAllDbConnections()
})
