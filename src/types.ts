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

export interface User {
  id: number
  email: string
  name: string
  password: string
  created_at: string
  updated_at: string
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginFormProps {
  apiEndpoint?: string
  redirectTo?: string
}

