<script setup lang="ts">
import type { Visualization } from '@image-taxonomy-labeler/shared/plugins/visualization'
import VImage from '@image-taxonomy-labeler/ui/data-display/VImage.vue'

defineProps({
  /** Render the given part of the visualization metadata. */
  datum: {
    type: Object as PropType<Visualization>,
    required: true,
  },
})

const emit = defineEmits<{
  /** Open the metadata tip anchored to the image. */
  (e: 'openMetadata', el: HTMLElement): void
}>()

const imageWrap = ref<HTMLElement>()

const onImageClick = () => {
  if (imageWrap.value !== undefined) emit('openMetadata', imageWrap.value)
}
</script>

<template>
  <div
    class="flex flex-col gap-1 border border-gray-200 bg-slate-100 p-1 text-sm dark:border-gray-700 dark:bg-slate-900"
  >
    <TheWidgetTaxonomization :uuid="datum.uuid" />
    <TheWidgetClassification :uuid="datum.uuid" />
    <div
      ref="imageWrap"
      class="relative cursor-pointer"
      title="Click image to view metadata"
      @click.stop="onImageClick"
    >
      <VImage
        :url="datum.downloadUrl ?? ''"
        :uuid="datum.uuid"
      />
    </div>
  </div>
</template>
