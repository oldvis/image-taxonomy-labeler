<script setup lang="ts">
import type { Visualization } from '@image-taxonomy-labeler/shared/plugins/visualization'
import { getThumbnailUrl } from '@image-taxonomy-labeler/shared/services/image'
import VImage from '@image-taxonomy-labeler/ui/data-display/VImage.vue'

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
    class="relative h-full min-h-0 min-w-0 overflow-hidden border border-gray-200 bg-slate-100 text-sm cursor-pointer dark:border-gray-700 dark:bg-slate-900"
    title="Click image to view metadata"
  >
    <VImage
      :url="datum.uuid === undefined ? '' : getThumbnailUrl(datum.uuid)"
      :uuid="datum.uuid"
      class="absolute inset-0 h-full w-full"
    />
    <div class="absolute inset-x-0 top-0 z-1 max-h-full overflow-auto">
      <slot />
    </div>
  </div>
</template>
