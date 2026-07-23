<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  nTotal: {
    type: Number as PropType<number>,
    required: true,
  },
  nMatched: {
    type: Number as PropType<number | null>,
    default: null,
  },
  nInPage: {
    type: Number as PropType<number>,
    required: true,
  },
  nInPageLabeled: {
    type: Number as PropType<number>,
    required: true,
  },
})
</script>

<template>
  <div view-header>
    <div class="i-fa6-solid:table my-auto" />
    <div class="font-bold">
      Entries
    </div>
    <div class="grow" />
    <div class="text-sm my-auto flex pr-4">
      <div class="font-bold">
        {{ nInPageLabeled }}/{{ nInPage }}&nbsp;
      </div>
      in page labeled
    </div>
    <div
      v-if="nMatched !== null"
      class="text-sm my-auto flex pr-4"
    >
      #matched:&nbsp;
      <div class="font-bold">
        {{ nMatched }}
      </div>
    </div>
    <div class="text-sm my-auto flex pr-4">
      #entries:&nbsp;
      <div class="font-bold">
        {{ nTotal }}
      </div>
    </div>
  </div>
</template>
