<script setup lang="ts">
import { computed } from 'vue'
import { useRuntimeConfig } from '#app'
import type { PasswordValidationResult, RuntimeModuleOptions } from 'nuxt-users/utils'
import { useNuxtUsersLocale } from '../composables/useNuxtUsersLocale'

const { t } = useNuxtUsersLocale()

// Note: We define Props interface inline to ensure compatibility during the module build process
interface Props {
  password: string
  validationResult: PasswordValidationResult | null
  showHints?: boolean
  showRules?: boolean
  // Optional label overrides
  weakLabel?: string
  mediumLabel?: string
  strongLabel?: string
  unknownLabel?: string
  requirementsTitleText?: string
  hintsTitleText?: string
}

const props = withDefaults(defineProps<Props>(), {
  showHints: true,
  showRules: true
})

const { public: { nuxtUsers } } = useRuntimeConfig()
const moduleOptions = nuxtUsers as RuntimeModuleOptions

const hasErrors = computed(() => (props.validationResult?.errors?.length || 0) > 0)
const hasHints = computed(() => (props.validationResult?.hints?.length || 0) > 0)
const hasPassword = computed(() => props.password?.length > 0)

// Validation rules checking
const validationRules = computed(() => {
  if (!props.password) return []

  const rules = []

  if (moduleOptions.passwordValidation?.minLength) {
    const hasMinLength = props.password.length >= moduleOptions.passwordValidation.minLength
    rules.push({
      text: t('passwordStrength.requirements.minLength', [moduleOptions.passwordValidation.minLength]),
      passed: hasMinLength
    })
  }

  if (moduleOptions.passwordValidation?.requireUppercase) {
    const hasUppercase = /[A-Z]/.test(props.password)
    rules.push({
      text: t('passwordStrength.requirements.uppercase'),
      passed: hasUppercase
    })
  }

  if (moduleOptions.passwordValidation?.requireLowercase) {
    const hasLowercase = /[a-z]/.test(props.password)
    rules.push({
      text: t('passwordStrength.requirements.lowercase'),
      passed: hasLowercase
    })
  }

  if (moduleOptions.passwordValidation?.requireNumbers) {
    const hasNumbers = /\d/.test(props.password)
    rules.push({
      text: t('passwordStrength.requirements.numbers'),
      passed: hasNumbers
    })
  }

  if (moduleOptions.passwordValidation?.requireSpecialChars) {
    const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(props.password)
    rules.push({
      text: t('passwordStrength.requirements.specialChars'),
      passed: hasSpecialChars
    })
  }

  return rules
})

const resolveTranslation = (message: string) => {
  if (!message) return ''
  if (message.includes('|')) {
    const [key = '', paramStr] = message.split('|')
    const params = paramStr ? paramStr.split(',') : []
    return t(key, params)
  }
  return t(message)
}
</script>

<template>
  <div
    v-if="hasPassword"
    class="n-users-password-strength"
  >
    <div class="n-users-strength-bar">
      <div
        class="n-users-strength-fill"
        :style="{
          width: `${validationResult?.score || 0}%`,
          backgroundColor: validationResult?.strength === 'weak' ? '#dc3545'
            : validationResult?.strength === 'medium' ? '#ffc107'
              : validationResult?.strength === 'strong' ? '#28a745' : '#6c757d',
        }"
      />
    </div>
    <span
      class="n-users-strength-text"
      :style="{
        color: validationResult?.strength === 'weak' ? '#dc3545'
          : validationResult?.strength === 'medium' ? '#ffc107'
            : validationResult?.strength === 'strong' ? '#28a745' : '#6c757d',
      }"
    >
      {{ validationResult?.strength === 'weak' ? (props.weakLabel || t('passwordStrength.strength.weak'))
        : validationResult?.strength === 'medium' ? (props.mediumLabel || t('passwordStrength.strength.medium'))
          : validationResult?.strength === 'strong' ? (props.strongLabel || t('passwordStrength.strength.strong'))
            : (props.unknownLabel || t('passwordStrength.strength.unknown')) }}
      ({{ validationResult?.score || 0 }}%)
    </span>
  </div>

  <!-- Validation rules -->
  <div
    v-if="showRules && hasPassword"
    class="n-users-validation-rules n-users-validation-container"
  >
    <div class="n-users-rules-title n-users-container-title">
      {{ props.requirementsTitleText || t('passwordStrength.label') }}
    </div>
    <ul class="n-users-rules-list n-users-list-unstyled">
      <li
        v-for="rule in validationRules"
        :key="rule.text"
        class="n-users-rule-item n-users-list-item"
        :class="{ 'n-users-rule-passed': rule.passed, 'n-users-rule-failed': !rule.passed }"
      >
        <span class="n-users-rule-icon n-users-icon">
          {{ rule.passed ? '✓' : '✗' }}
        </span>
        <span class="n-users-rule-text n-users-text">
          {{ rule.text }}
        </span>
      </li>
    </ul>
  </div>

  <!-- Validation errors -->
  <div
    v-if="hasErrors"
    class="n-users-validation-errors"
  >
    <small
      v-for="error in validationResult?.errors || []"
      :key="String(error)"
      class="n-users-error-text"
    >
      {{ resolveTranslation(error) }}
    </small>
  </div>

  <!-- Password improvement hints -->
  <div
    v-if="showHints && hasPassword && hasHints"
    class="n-users-password-hints n-users-validation-container"
  >
    <div class="n-users-hint-title n-users-container-title">
      {{ props.hintsTitleText || t('passwordStrength.hintsTitle') }}
    </div>
    <ul class="n-users-hint-list n-users-list-unstyled">
      <li
        v-for="hint in validationResult?.hints || []"
        :key="'hint-' + hint"
        class="n-users-hint-item n-users-list-item"
      >
        {{ resolveTranslation(hint) }}
      </li>
    </ul>
  </div>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
