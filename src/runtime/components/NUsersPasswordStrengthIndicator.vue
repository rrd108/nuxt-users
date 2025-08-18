<script setup lang="ts">
import { computed } from 'vue'
import type { PasswordValidationResult } from '../../utils'
import { useRuntimeConfig } from '#imports'
import type { ModuleOptions } from "nuxt-users/utils"

interface Props {
  password: string
  validationResult: PasswordValidationResult | null
  showHints?: boolean
  showRules?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHints: true,
  showRules: true
})

const { public: { nuxtUsers } } = useRuntimeConfig()
const moduleOptions = nuxtUsers as ModuleOptions

const hasErrors = computed(() => (props.validationResult?.errors?.length || 0) > 0)
const hasHints = computed(() => (props.validationResult?.hints?.length || 0) > 0)
const hasPassword = computed(() => props.password?.length > 0)

// Validation rules checking
const validationRules = computed(() => {
  if (!props.password) return []

  const rules = []

  if (moduleOptions.passwordValidation.minLength) {
    const hasMinLength = props.password.length >= moduleOptions.passwordValidation.minLength
    rules.push({
      text: `At least ${moduleOptions.passwordValidation.minLength} characters`,
      passed: hasMinLength
    })
  }

  if (moduleOptions.passwordValidation.requireUppercase) {
    const hasUppercase = /[A-Z]/.test(props.password)
    rules.push({
      text: 'Contains uppercase letter (A-Z)',
      passed: hasUppercase
    })
  }

  if (moduleOptions.passwordValidation.requireLowercase) {
    const hasLowercase = /[a-z]/.test(props.password)
    rules.push({
      text: 'Contains lowercase letter (a-z)',
      passed: hasLowercase
    })
  }

  if (moduleOptions.passwordValidation.requireNumbers) {
    const hasNumbers = /\d/.test(props.password)
    rules.push({
      text: 'Contains number (0-9)',
      passed: hasNumbers
    })
  }

  if (moduleOptions.passwordValidation.requireSpecialChars) {
    const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(props.password)
    rules.push({
      text: 'Contains special character (!@#$%^&*)',
      passed: hasSpecialChars
    })
  }

  return rules
})
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
      {{ validationResult?.strength === 'weak' ? 'Weak'
        : validationResult?.strength === 'medium' ? 'Medium'
          : validationResult?.strength === 'strong' ? 'Strong' : 'Unknown' }}
      ({{ validationResult?.score || 0 }}%)
    </span>
  </div>

  <!-- Validation rules -->
  <div
    v-if="showRules && hasPassword"
    class="n-users-validation-rules n-users-validation-container"
  >
    <div class="n-users-rules-title n-users-container-title">
      Password Requirements:
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
      {{ error }}
    </small>
  </div>

  <!-- Password improvement hints -->
  <div
    v-if="showHints && hasPassword && hasHints"
    class="n-users-password-hints n-users-validation-container"
  >
    <div class="n-users-hint-title n-users-container-title">
      How to make your password stronger:
    </div>
    <ul class="n-users-hint-list n-users-list-unstyled">
      <li
        v-for="hint in validationResult?.hints || []"
        :key="'hint-' + hint"
        class="n-users-hint-item n-users-list-item"
      >
        {{ hint }}
      </li>
    </ul>
  </div>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
