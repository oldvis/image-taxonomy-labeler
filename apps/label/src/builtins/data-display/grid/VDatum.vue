<script setup lang="ts">
import type { Visualization } from '@image-taxonomy-labeler/shared/plugins/visualization'
import { isDark } from '@image-taxonomy-labeler/ui/composables/dark'
import VImage from '@image-taxonomy-labeler/ui/data-display/VImage.vue'
import { useLabelTask as useClassification } from '@image-taxonomy-labeler/ui/label-tasks/classification/useLabelTask'
import { confidenceBorderStyle, getConfidenceBorderStatus } from '../confidenceBorder'
import { denseImageUrl } from '../denseImageUrl'

const props = defineProps({
  /** Render the given part of the visualization metadata. */
  datum: {
    type: Object as PropType<Visualization>,
    required: true,
  },
  /** Number of images on the current dense page (drives full vs thumbnail). */
  pageCount: {
    type: Number,
    required: true,
  },
})

const { annotationsByUuid } = useClassification()

const borderStyle = computed(() => {
  const values = annotationsByUuid.value[props.datum.uuid]?.map((d) => d.value)
  const status = getConfidenceBorderStatus(values)
  return confidenceBorderStyle(status, isDark.value)
})

const imageUrl = computed(() => denseImageUrl({
  uuid: props.datum.uuid,
  downloadUrl: props.datum.downloadUrl,
  pageCount: props.pageCount,
}))
</script>

<template>
  <div
    class="relative h-full min-h-0 min-w-0 overflow-hidden text-sm cursor-pointer"
    title="Click image to view metadata and labeling"
    bg="slate-100 dark:slate-900"
  >
    <VImage
      :url="imageUrl"
      :uuid="datum.uuid"
      class="absolute inset-0 h-full w-full"
    />
    <!-- Inset ring above the image so Sure/Unsure status stays visible. -->
    <div
      class="pointer-events-none absolute inset-0 z-1"
      :style="borderStyle"
    />
    <div
      v-if="$slots.default"
      class="absolute inset-x-0 top-0 z-2 max-h-full overflow-auto"
    >
      <slot />
    </div>
  </div>
</template>
