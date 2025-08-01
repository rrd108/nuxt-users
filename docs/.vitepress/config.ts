import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Nuxt Users',
  description: 'A user authentication module for Nuxt 3 with database support for SQLite, MySQL, and PostgreSQL',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'stylesheet', href: '/styles.css' }],
    /* [
      'script',
      {
        async: '',
        src: 'https://www.googletagmanager.com/gtag/js?id=G-4WQ5DGB03H',
      },
    ],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-4WQ5DGB03H');`,
    ], */
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    search: {
      provider: 'local',
    },
    logo: '/logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Get Started', link: '/get-started' },
    ],
    sidebar: [
      {
        items: [
          { text: 'Get Started', link: '/get-started' },
          {
            text: 'Guide',
            items: [
              { text: 'Installation', link: '/guide/installation' },
              { text: 'Quick Start', link: '/guide/quick-start' },
              { text: 'Configuration', link: '/guide/configuration' },
              { text: 'Authentication', link: '/guide/authentication' },
              { text: 'Password Reset', link: '/guide/password-reset' },
              { text: 'Database Setup', link: '/guide/database-setup' }
            ]
          },
          {
            text: 'API Reference',
            items: [
              { text: 'Login', link: '/api/auth/login' },
              { text: 'Password Reset', link: '/api/password-reset' }
            ]
          },
          {
            text: 'Components',
            items: [
              { text: 'LoginForm', link: '/components/login-form' },
              { text: 'ResetPasswordForm', link: '/components/reset-password-form' }
            ]
          },
          {
            text: 'Database',
            items: [
              { text: 'Schema', link: '/database/schema' },
              { text: 'Migrations', link: '/database/migrations' },
              { text: 'CLI Commands', link: '/database/cli-commands' }
            ]
          },
          {
            text: 'Contributing',
            items: [
              { text: 'Development Setup', link: '/contributing/development-setup' },
              { text: 'Running Tests', link: '/contributing/running-tests' },
              { text: 'Guidelines', link: '/contributing/guidelines' }
            ]
          }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/rrd108/nuxt-users' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present'
    }
  },
  markdown: {
    theme: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
    lineNumbers: true,
  },
})
