import { defineBuildConfig } from 'unbuild'
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
    inlineDependencies: ['citty', 'defu']
  },
  externals: [
    ...EXTERNALS,
    'bcrypt',
    'nodemailer'
  ]
})
