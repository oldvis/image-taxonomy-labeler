<script setup lang="ts">
import type { Visualization } from '~/plugins/visualization'
import VImage from '../VImage.vue'

defineProps({
  /** Render the given part of the visualization metadata. */
  datum: {
    type: Object as PropType<Visualization>,
    required: true,
  },
})
</script>

<template>
  <div
    class="p-1 text-sm gap-1 cursor-pointer"
    bg="slate-100 dark:slate-900"
    border="~ gray-200"
    flex="~ col"
  >
    <TheWidgetTaxonomization :uuid="datum.uuid" />
    <TheWidgetClassification :uuid="datum.uuid" />
    <VImage
      :url="datum.downloadUrl ?? ''"
      :uuid="datum.uuid"
    />
  </div>
</template>
