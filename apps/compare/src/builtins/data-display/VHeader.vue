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
})
</script>

<template>
  <div view-header>
    <div class="i-fa6-solid:images text-gray-500 shrink-0" />
    <span class="strip-label">Entries</span>
    <div class="grow" />
    <div class="strip-meta flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <template v-if="nMatched !== null">
        <span>
          <span class="strip-meta-em">{{ nMatched }}</span> matched
        </span>
        <span
          class="strip-sep"
          aria-hidden="true"
        >·</span>
      </template>
      <span>
        <span class="strip-meta-em">{{ nTotal }}</span> in workspace
      </span>
    </div>
  </div>
</template>
