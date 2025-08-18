import { ref, computed } from 'vue'
import { validatePassword, getPasswordValidationOptions, getPasswordStrengthColor, getPasswordStrengthText, type PasswordValidationResult, type PasswordValidationOptions } from '../../utils'
import type { RuntimeModuleOptions } from "nuxt-users/utils"

export const usePasswordValidation = (moduleOptions?: RuntimeModuleOptions, options?: PasswordValidationOptions) => {
  const passwordOptions = getPasswordValidationOptions(moduleOptions)
  const finalOptions = { ...passwordOptions, ...options }
  const password = ref('')
  const validationResult = ref<PasswordValidationResult | null>(null)

  const validate = (passwordToValidate: string) => {
    password.value = passwordToValidate
    validationResult.value = validatePassword(passwordToValidate, finalOptions)
    return validationResult.value
  }

  const isValid = computed(() => validationResult.value?.isValid ?? false)
  const errors = computed(() => validationResult.value?.errors ?? [])
  const hints = computed(() => validationResult.value?.hints ?? [])
  const strength = computed(() => validationResult.value?.strength ?? 'weak')
  const score = computed(() => validationResult.value?.score ?? 0)
  const strengthColor = computed(() => getPasswordStrengthColor(strength.value))
  const strengthText = computed(() => getPasswordStrengthText(strength.value))

  const clearValidation = () => {
    password.value = ''
    validationResult.value = null
  }

  return {
    password,
    validationResult,
    validate,
    isValid,
    errors,
    hints,
    strength,
    score,
    strengthColor,
    strengthText,
    clearValidation
  }
}
