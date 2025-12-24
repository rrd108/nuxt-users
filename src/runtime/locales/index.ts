import type { LocaleMessages } from '../../types'
import { en } from './en'
import { hu, huFormal } from './hu'

export const defaultLocaleMessages: Record<string, LocaleMessages> = {
  en,
  hu,
  'hu-formal': huFormal
}

export { en, hu, huFormal }
