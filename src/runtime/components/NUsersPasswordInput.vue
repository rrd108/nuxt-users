<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNuxtUsersLocale } from '../composables/useNuxtUsersLocale'

interface Props {
  modelValue?: string
  id?: string
  name?: string
  placeholder?: string
  required?: boolean
  minlength?: number
  disabled?: boolean
  autocomplete?: string
  inputClass?: string | Record<string, boolean> | Array<string | Record<string, boolean>>
  showPasswordLabel?: string
  hidePasswordLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { t } = useNuxtUsersLocale()
const showPassword = ref(false)

const toggleTitle = computed(() =>
  showPassword.value
    ? (props.hidePasswordLabel || t('common.hidePassword'))
    : (props.showPasswordLabel || t('common.showPassword'))
)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="n-users-password-wrapper">
    <input
      :id="id"
      :value="modelValue"
      :type="showPassword ? 'text' : 'password'"
      :name="name"
      :placeholder="placeholder"
      :required="required"
      :minlength="minlength"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :class="inputClass"
      @input="handleInput"
    >
    <button
      type="button"
      class="n-users-password-toggle"
      :title="toggleTitle"
      :disabled="disabled"
      @click="showPassword = !showPassword"
    >
      <svg
        v-if="!showPassword"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line
          x1="1"
          y1="1"
          x2="23"
          y2="23"
        />
      </svg>
      <svg
        v-if="showPassword"
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle
          cx="12"
          cy="12"
          r="3"
        />
      </svg>
    </button>
  </div>
</template>
