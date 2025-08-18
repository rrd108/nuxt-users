import { defineBuildConfig } from 'unbuild'
import { fileURLToPath } from 'node:url'
import { EXTERNALS } from './src/constants'

export default defineBuildConfig({
  entries: [
    './src/module',
    {
      input: './src/utils/index',
      name: 'utils'
    },
    {
      builder: 'rollup',
      input: './src/cli/main',
      name: 'cli'
    }
  ],
  declaration: true,
  clean: true,
  failOnWarn: false,
  // Configure alias resolution for build process
  alias: {
    'nuxt-users/utils': fileURLToPath(new URL('./src/utils/index.ts', import.meta.url))
  },
  rollup: {
    inlineDependencies: ['citty', 'defu'],
    alias: {
      entries: [
        { find: 'nuxt-users/utils', replacement: fileURLToPath(new URL('./src/utils/index.ts', import.meta.url)) }
      ]
    }
  },
  externals: [
    ...EXTERNALS,
    'bcrypt',
    'nodemailer'
  ]
})
