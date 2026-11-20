<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PasskeySummary } from 'nuxt-users/utils'
import { usePasskeys } from '../composables/usePasskeys'
import { useNuxtUsersLocale } from '../composables/useNuxtUsersLocale'

const { t } = useNuxtUsersLocale()

interface Props {
  title?: string
  description?: string
}

interface Emits {
  (e: 'registered', passkey: PasskeySummary): void
  (e: 'removed', id: number): void
  (e: 'error', error: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { enabled, supported, list, register, remove } = usePasskeys()

const passkeys = ref<PasskeySummary[]>([])
const isLoading = ref(false)
const isAdding = ref(false)
const removingId = ref<number | null>(null)
const error = ref('')
const newName = ref('')

const extractErrorMessage = (err: unknown, fallback: string): string => {
  // The authenticator already holds a passkey for this account
  if (err instanceof Error && err.name === 'InvalidStateError') {
    return t('passkey.manager.alreadyRegistered')
  }
  if (err && typeof err === 'object' && 'data' in err && err.data && typeof err.data === 'object' && 'statusMessage' in err.data) {
    return String(err.data.statusMessage)
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return fallback
}

const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString() : t('passkey.manager.neverUsed')

const fail = (message: string) => {
  error.value = message
  emit('error', message)
}

const load = async () => {
  isLoading.value = true
  error.value = ''
  try {
    passkeys.value = await list()
  }
  catch (err: unknown) {
    fail(extractErrorMessage(err, t('passkey.manager.loadFailed')))
  }
  finally {
    isLoading.value = false
  }
}

const handleAdd = async () => {
  isAdding.value = true
  error.value = ''
  try {
    const passkey = await register(newName.value.trim() || undefined)
    if (!passkey) {
      // The user dismissed the browser prompt: nothing was added, nothing to report
      return
    }
    newName.value = ''
    passkeys.value = [...passkeys.value, passkey]
    emit('registered', passkey)
  }
  catch (err: unknown) {
    fail(extractErrorMessage(err, t('passkey.manager.addFailed')))
  }
  finally {
    isAdding.value = false
  }
}

const handleRemove = async (passkey: PasskeySummary) => {
  if (!window.confirm(t('passkey.manager.removeConfirm', [passkey.name]))) {
    return
  }
  removingId.value = passkey.id
  error.value = ''
  try {
    await remove(passkey.id)
    passkeys.value = passkeys.value.filter(item => item.id !== passkey.id)
    emit('removed', passkey.id)
  }
  catch (err: unknown) {
    fail(extractErrorMessage(err, t('passkey.manager.removeFailed')))
  }
  finally {
    removingId.value = null
  }
}

onMounted(() => {
  if (enabled.value) {
    load()
  }
})
</script>

<template>
  <section
    v-if="enabled"
    class="n-users-passkey-manager n-users-section"
  >
    <slot name="header">
      <h2 class="n-users-section-header">
        {{ props.title || t('passkey.manager.title') }}
      </h2>
      <p class="n-users-passkey-description">
        {{ props.description || t('passkey.manager.description') }}
      </p>
    </slot>

    <p
      v-if="isLoading"
      class="n-users-passkey-loading"
    >
      {{ t('passkey.manager.loading') }}
    </p>

    <ul
      v-else-if="passkeys.length"
      class="n-users-passkey-list"
    >
      <li
        v-for="passkey in passkeys"
        :key="passkey.id"
        class="n-users-passkey-item"
      >
        <div class="n-users-passkey-info">
          <strong class="n-users-passkey-name">{{ passkey.name }}</strong>
          <span
            v-if="passkey.backed_up"
            class="n-users-passkey-badge"
          >{{ t('passkey.manager.synced') }}</span>
          <small class="n-users-passkey-meta">
            {{ t('passkey.manager.created') }}: {{ formatDate(passkey.created_at) }}
            · {{ t('passkey.manager.lastUsed') }}: {{ formatDate(passkey.last_used_at) }}
          </small>
        </div>
        <button
          type="button"
          class="n-users-passkey-remove-btn"
          :disabled="removingId === passkey.id"
          @click="handleRemove(passkey)"
        >
          {{ t('passkey.manager.remove') }}
        </button>
      </li>
    </ul>

    <p
      v-else
      class="n-users-passkey-empty"
    >
      {{ t('passkey.manager.empty') }}
    </p>

    <form
      v-if="supported"
      class="n-users-passkey-add"
      @submit.prevent="handleAdd"
    >
      <div class="n-users-form-group">
        <label for="n-users-passkey-name">{{ t('passkey.manager.nameLabel') }}</label>
        <input
          id="n-users-passkey-name"
          v-model="newName"
          type="text"
          name="passkeyName"
          maxlength="100"
          :placeholder="t('passkey.manager.namePlaceholder')"
        >
      </div>
      <button
        type="submit"
        :disabled="isAdding"
      >
        <span
          v-if="isAdding"
          class="n-users-loading-spinner"
        />
        {{ isAdding ? t('passkey.manager.adding') : t('passkey.manager.add') }}
      </button>
    </form>
    <p
      v-else
      class="n-users-passkey-unsupported"
    >
      {{ t('passkey.manager.unsupported') }}
    </p>

    <div
      v-if="error"
      class="n-users-error-message"
    >
      {{ error }}
    </div>
  </section>
</template>

<!-- CSS removed - now consolidated in nuxt-users.css -->
