import { defineTask } from 'nitropack/runtime/task'

export default defineTask({
  meta: {
    name: 'gauranga',
    description: 'Test task that returns "Gauranga"'
  },
  async run() {
    return {
      result: {
        message: 'Gauranga',
        timestamp: new Date().toISOString()
      }
    }
  }
})
