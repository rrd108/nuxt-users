<script setup lang="ts">
import { computed } from 'vue'
import type { PasswordValidationResult } from '../../utils'
import { useRuntimeConfig } from '#imports'
import type { ModuleOptions } from '../../types'

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
const hasPassword = computed(() => props.password.length > 0)

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
    class="password-strength"
  >
    <div class="strength-bar">
      <div
        class="strength-fill"
        :style="{
          width: `${validationResult?.score || 0}%`,
          backgroundColor: validationResult?.strength === 'weak' ? '#dc3545'
            : validationResult?.strength === 'medium' ? '#ffc107'
              : validationResult?.strength === 'strong' ? '#28a745' : '#6c757d',
        }"
      />
    </div>
    <span
      class="strength-text"
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
    class="validation-rules"
  >
    <div class="rules-title">
      Password Requirements:
    </div>
    <ul class="rules-list">
      <li
        v-for="rule in validationRules"
        :key="rule.text"
        class="rule-item"
        :class="{ 'rule-passed': rule.passed, 'rule-failed': !rule.passed }"
      >
        <span class="rule-icon">
          {{ rule.passed ? '✓' : '✗' }}
        </span>
        <span class="rule-text">
          {{ rule.text }}
        </span>
      </li>
    </ul>
  </div>

  <!-- Validation errors -->
  <div
    v-if="hasErrors"
    class="validation-errors"
  >
    <small
      v-for="error in validationResult?.errors || []"
      :key="String(error)"
      class="error-text"
    >
      {{ error }}
    </small>
  </div>

  <!-- Password improvement hints -->
  <div
    v-if="showHints && hasPassword && hasHints"
    class="password-hints"
  >
    <div class="hint-title">
      How to make your password stronger:
    </div>
    <ul class="hint-list">
      <li
        v-for="hint in validationResult?.hints || []"
        :key="'hint-' + hint"
        class="hint-item"
      >
        {{ hint }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.password-strength {
  margin-top: 8px;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background-color: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.strength-text {
  font-size: 0.75rem;
  font-weight: 500;
}

.validation-rules {
  margin-top: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.rules-title {
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.rules-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.rule-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.rule-item:last-child {
  margin-bottom: 0;
}

.rule-passed {
  color: #28a745;
}

.rule-failed {
  color: #dc3545;
}

.rule-icon {
  font-weight: bold;
  margin-right: 8px;
  min-width: 16px;
  text-align: center;
}

.rule-text {
  flex: 1;
}

.validation-errors {
  margin-top: 8px;
}

.error-text {
  color: #dc3545;
  font-size: 0.875rem;
  display: block;
  margin-bottom: 4px;
}

.error-text:last-child {
  margin-bottom: 0;
}

.password-hints {
  margin-top: 8px;
  padding: 12px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.hint-title {
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.hint-list {
  margin: 0;
  padding-left: 16px;
}

.hint-item {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.hint-item:last-child {
  margin-bottom: 0;
}
</style>
