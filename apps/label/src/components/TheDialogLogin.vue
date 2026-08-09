<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useUserStore } from '~/stores/user'

const dialog = ref(false)
const userStore = useUserStore()
const { isSignedIn, name } = storeToRefs(userStore)
const { signOut, signIn } = userStore
const { addErrorMessage, addSuccessMessage } = useMessageStore()
const userName = ref('' as string | null)
const onClickSignIn = () => {
  if (!userName.value) {
    addErrorMessage('Login failed')
    return
  }
  signIn(userName.value)
  if (isSignedIn.value) {
    addSuccessMessage('Login succeeded')
    dialog.value = false
  }
  else {
    addErrorMessage('Login failed')
  }
}
onMounted(() => {
  userName.value = name.value
})
</script>

<template>
  <VDialog :dialog="dialog">
    <template #activator>
      <button
        v-if="!isSignedIn"
        type="button"
        btn-secondary
        class="flex gap-1 items-center"
        title="Set a local annotator name for new labels"
        @click="dialog = true"
      >
        <div class="i-fa6-regular:user my-auto" />
        <span>Set annotator name</span>
      </button>
      <div
        v-else
        class="flex gap-1 items-center"
      >
        <button
          type="button"
          btn-secondary
          class="flex gap-1 items-center"
          title="Change annotator name"
          @click="dialog = true"
        >
          <div class="i-fa6-regular:user my-auto" />
          <span>Hi, {{ userName }}</span>
        </button>
        <button
          type="button"
          btn-ghost
          title="Clear annotator name"
          @click="signOut"
        >
          Clear
        </button>
      </div>
    </template>
    <template #default>
      <div class="dialog-panel">
        <div class="status-strip border-b border-gray-200 dark:border-gray-700">
          <span class="font-semibold text-sm">Set annotator name</span>
          <div class="grow" />
          <button
            type="button"
            icon-btn
            title="Close"
            @click="dialog = false"
          >
            <div class="i-fa6-solid:xmark" />
          </button>
        </div>
        <div class="dialog-body">
          <label
            for="user"
            class="text-sm text-gray-700 dark:text-gray-200"
          >
            Name
          </label>
          <input
            id="user"
            v-model="userName"
            dialog-field
            placeholder="Name"
            required
          >
          <div class="flex gap-1 justify-end">
            <button
              type="button"
              btn-secondary
              @click="dialog = false"
            >
              Cancel
            </button>
            <button
              type="button"
              btn
              @click="onClickSignIn"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </template>
  </VDialog>
</template>
