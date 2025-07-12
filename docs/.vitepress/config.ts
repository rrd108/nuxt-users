import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Nuxt Users',
  description: 'A user authentication module for Nuxt 3 with database support for SQLite and MySQL',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Components', link: '/components/' },
      { text: 'Database', link: '/database/' },
      { text: 'Contributing', link: '/contributing/' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Configuration', link: '/guide/configuration' }
          ]
        },
        {
          text: 'Features',
          items: [
            { text: 'Authentication', link: '/guide/authentication' },
            { text: 'Password Reset', link: '/guide/password-reset' },
            { text: 'Database Setup', link: '/guide/database-setup' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Login', link: '/api/login' },
            { text: 'Password Reset', link: '/api/password-reset' }
          ]
        }
      ],
      '/components/': [
        {
          text: 'Components',
          items: [
            { text: 'LoginForm', link: '/components/login-form' },
            { text: 'ForgotPasswordForm', link: '/components/forgot-password-form' },
            { text: 'ResetPasswordForm', link: '/components/reset-password-form' }
          ]
        }
      ],
      '/database/': [
        {
          text: 'Database',
          items: [
            { text: 'Schema', link: '/database/schema' },
            { text: 'Migrations', link: '/database/migrations' },
            { text: 'CLI Commands', link: '/database/cli-commands' }
          ]
        }
      ],
      '/contributing/': [
        {
          text: 'Contributing',
          items: [
            { text: 'Development Setup', link: '/contributing/development-setup' },
            { text: 'Running Tests', link: '/contributing/running-tests' },
            { text: 'Guidelines', link: '/contributing/guidelines' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-org/nuxt-users' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present'
    }
  }
})
