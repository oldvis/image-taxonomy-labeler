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
    <div class="i-fa6-solid:table my-auto" />
    <div class="font-bold">
      Entries
    </div>
    <TheToggleLayout v-model:layout="layout" />
    <div class="grow" />
    <div class="flex">
      <div class="flex border-l px-1">
        <div class="font-bold">
          {{ nInPageLabeled }}/{{ nInPage }}&nbsp;
        </div>
        in page grouped
      </div>
      <div
        v-if="nMatched !== null"
        class="flex border-l px-1"
      >
        <b>{{ nMatched }}&nbsp;</b>
        matched
      </div>
      <div class="flex border-l px-1">
        <b>{{ nTotal }}&nbsp;</b>
        in workspace
      </div>
    </div>
  </div>
</template>
