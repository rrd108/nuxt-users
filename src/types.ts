export interface ModuleOptions {
    connector?: {
      name: 'sqlite' | 'mysql' | 'postgresql'
      options: {
        path?: string
        host?: string
        port?: number
        username?: string
        password?: string
        database?: string
      }
    }
  }
  