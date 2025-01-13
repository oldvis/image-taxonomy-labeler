<script setup lang="tsx">
import type { PropType } from 'vue'

/** Whether the grid layout is enabled. */
defineProps({
  layout: {
    type: String as PropType<'single' | 'columns' | 'grid'>,
    required: true,
  },
})
const emit = defineEmits<{
  (e: 'update:layout', d: 'single' | 'columns' | 'grid'): void
}>()
</script>

<template>
  <div class="flex text-sm">
    <button
      btn-outline p-0.5
      rounded="s e-unset"
      :class="{ 'text-teal-600': layout === 'single' }"
      title="Single object layout"
      @click="emit('update:layout', 'single')"
    >
      <div class="i-fa6-regular:square" h-3.5 />
    </button>
    <button
      btn-outline p-0.5
      border-x-unset rounded-unset
      :class="{ 'text-teal-600': layout === 'columns' }"
      title="Columns layout"
      @click="emit('update:layout', 'columns')"
    >
      <div class="i-fa6-solid:table-cells-large" h-3.5 />
    </button>
    <button
      btn-outline p-0.5
      rounded="e s-unset"
      :class="{ 'text-teal-600': layout === 'grid' }"
      title="Grid layout"
      @click="emit('update:layout', 'grid')"
    >
      <div class="i-fa6-solid:table-cells" h-3.5 />
    </button>
  </div>
</template>
