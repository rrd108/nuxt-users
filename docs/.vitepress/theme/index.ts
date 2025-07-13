import DefaultTheme from 'vitepress/theme'
import ModuleContributors from '../components/ModuleContributors.vue'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('ModuleContributors', ModuleContributors)
  },
}
