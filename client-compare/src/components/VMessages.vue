<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStore } from '~/stores/message'
import VMessage from './VMessage.vue'

const messageStore = useStore()
const { messages } = storeToRefs(messageStore)
const { removeMessage } = messageStore
</script>

<template>
  <div
    class="fixed w-screen h-screen items-end justify-end pointer-events-none z-2"
    flex="~ col"
  >
    <VMessage
      v-for="message in messages"
      :key="`${message.uuid}`"
      class="mx-2 mb-2 pointer-events-auto"
      :message="message"
      @close="removeMessage(message.uuid)"
    />
  </div>
</template>
