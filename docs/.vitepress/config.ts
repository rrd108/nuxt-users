import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Nuxt Users',
  description: 'A user authentication and authorization module for Nuxt with database support for SQLite, MySQL, and PostgreSQL',
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
      { text: 'Get Started', link: '/user-guide/getting-started' },
    ],
    sidebar: [
      {
        items: [
          { text: 'Get Started', link: '/get-started' },
          {
            text: 'User Guide',
            items: [
              { text: 'Overview', link: '/user-guide/index' },
              { text: 'Getting Started', link: '/user-guide/getting-started' },
              { text: 'Installation', link: '/user-guide/installation' },
              { text: 'Configuration', link: '/user-guide/configuration' },
              { text: 'Authentication', link: '/user-guide/authentication' },
              { text: 'Authorization (RBAC)', link: '/user-guide/authorization' },
              { text: 'Password Reset', link: '/user-guide/password-reset' },
              { text: 'Localization (i18n)', link: '/user-guide/localization' },
              {
                text: 'Components',
                link: '/user-guide/components',
                items: [
                  { text: 'NUsersLoginForm', link: '/user-guide/components#nusersloginform' },
                  { text: 'NUsersRegisterForm', link: '/user-guide/components#nusersregisterform' },
                  { text: 'NUsersEmailConfirmation', link: '/user-guide/components#nusersemailconfirmation' },
                  { text: 'NUsersLogoutLink', link: '/user-guide/components#nuserslogoutlink' },
                  { text: 'NUsersResetPasswordForm', link: '/user-guide/components#nusersresetpasswordform' },
                  { text: 'NUsersList', link: '/user-guide/components#nuserslist' },
                  { text: 'NUsersUserCard', link: '/user-guide/components#nusersusercard' },
                  { text: 'NUsersUserForm', link: '/user-guide/components#nusersuserform' }
                ]
              },
              {
                text: 'Composables',
                link: '/user-guide/composables',
                items: [
                  { text: 'useUsers()', link: '/user-guide/composables#useusers' },
                  { text: 'useAuthentication()', link: '/user-guide/composables#useauthentication' },
                  { text: 'getCurrentUser()', link: '/user-guide/composables#getcurrentuser' },
                  { text: 'usePublicPaths()', link: '/user-guide/composables#usepublicpaths' },
                  { text: 'usePasswordValidation()', link: '/user-guide/composables#usepasswordvalidation' },
                  { text: 'useNuxtUsersLocale()', link: '/user-guide/composables#usenuxtuserslocale' }
                ]
              },
              { text: 'Troubleshooting', link: '/user-guide/troubleshooting' },
              { text: 'Agent Skill', link: '/user-guide/agent-skill' }
            ]
          },
          {
            text: 'API Reference',
            items: [
              { text: 'HTTP Endpoints', link: '/api/index' },
              { text: 'Public Types', link: '/api/types' }
            ]
          },
          {
            text: 'Examples',
            items: [
              { text: 'Basic Setup', link: '/examples/basic-setup' },
              { text: 'Custom Components', link: '/examples/custom-components' },
              { text: 'Advanced Configuration', link: '/examples/advanced-configuration' }
            ]
          },
          {
            text: 'Developer Guide',
            items: [
              { text: 'Overview', link: '/developer-guide/index' },
              { text: 'Development Setup', link: '/developer-guide/development-setup' },
              { text: 'Architecture', link: '/developer-guide/architecture' },
              { text: 'Composables', link: '/developer-guide/composables' },
              { text: 'Database Internals', link: '/developer-guide/database-internals' },
              { text: 'Server Utilities', link: '/developer-guide/server-utilities' },
              { text: 'Localization', link: '/developer-guide/localization' },
              { text: 'Testing', link: '/developer-guide/testing' },
              { text: 'Contributing', link: '/developer-guide/contributing' },
              { text: 'Code Style', link: '/developer-guide/code-style' }
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
