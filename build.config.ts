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
  rollup: {
    inlineDependencies: ['citty', 'defu'],
    alias: {
      entries: [
        { find: '#nuxt-users/types', replacement: fileURLToPath(new URL('./src/types.ts', import.meta.url)) }
      ]
    }
  },
  externals: [
    ...EXTERNALS,
    'bcrypt',
    'nodemailer'
  ]
})
