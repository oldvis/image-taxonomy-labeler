<script setup lang="ts">
import type { Visualization } from '~/plugins/visualization'
import { getThumbnailUrl } from '~/services/image'
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
    class="text-sm cursor-pointer"
    bg="slate-100 dark:slate-900"
    border="~ gray-200"
  >
    <VImage
      :url="datum.uuid === undefined ? '' : getThumbnailUrl(datum.uuid)"
      :uuid="datum.uuid"
      style="width: 100%; height: 100%;"
    />
  </div>
</template>
