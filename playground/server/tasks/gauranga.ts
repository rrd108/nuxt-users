import { defineTask } from 'nitropack/runtime/task'

interface TestGaurangaResult {
  message: string
  timestamp: string
}

export default defineTask({
  meta: {
    name: 'gauranga',
    description: 'Test task that returns "Gauranga"'
  },
  async run(): Promise<TestGaurangaResult> {
    return {
      message: 'Gauranga',
      timestamp: new Date().toISOString()
    }
  }
})
