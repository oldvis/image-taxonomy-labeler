<script setup lang="ts">
defineProps<{ dialog: boolean }>()
</script>

<template>
  <slot name="activator" />
  <Teleport to="#app">
    <div
      v-if="dialog"
      class="fixed w-full h-full flex z-2"
      bg="gray opacity-50"
    >
      <div class="m-auto">
        <slot>
          <div
            class="rounded shadow"
            bg="white dark:gray-700"
          />
        </slot>
      </div>
    </div>
  </Teleport>
</template>
