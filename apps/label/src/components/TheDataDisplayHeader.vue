<script setup lang="tsx">
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

/** Whether the grid layout is enabled. */
const layout = defineModel({
  type: String as PropType<'single' | 'columns' | 'grid'>,
  required: true,
})
</script>

<template>
  <div view-header>
    <div class="i-fa6-solid:images text-gray-500 shrink-0" />
    <span class="strip-label">Entries</span>
    <VToggleLayout v-model:layout="layout" />
    <div class="grow" />
    <div class="strip-meta flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span>
        <span class="strip-meta-em">{{ nInPageLabeled }}</span>/{{ nInPage }} in page grouped
      </span>
      <template v-if="nMatched !== null">
        <span
          class="strip-sep"
          aria-hidden="true"
        >·</span>
        <span>
          <span class="strip-meta-em">{{ nMatched }}</span> matched
        </span>
      </template>
      <span
        class="strip-sep"
        aria-hidden="true"
      >·</span>
      <span>
        <span class="strip-meta-em">{{ nTotal }}</span> in workspace
      </span>
    </div>
  </div>
</template>
