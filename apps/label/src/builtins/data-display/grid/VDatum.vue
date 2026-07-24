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
    class="text-sm cursor-pointer"
    bg="slate-100 dark:slate-900"
    border="~ gray-200"
  >
    <slot />
    <VImage
      :url="datum.uuid === undefined ? '' : getThumbnailUrl(datum.uuid)"
      :uuid="datum.uuid"
      style="width: 100%; height: 100%;"
    />
  </div>
</template>
