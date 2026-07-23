<script setup lang="ts">
import { useImage } from '@vueuse/core'
import { isHttps, isLocalhost } from './utils'

const props = defineProps({
  /** Render the given part of the visualization metadata. */
  url: {
    type: String as PropType<string>,
    required: true,
  },
  uuid: {
    type: String as PropType<string>,
    required: true,
  },
})

const { url, uuid } = toRefs(props)
const { isLoading } = useImage(computed(() => ({ src: url.value })))

const onDragStart = (e: DragEvent): void => {
  e.dataTransfer?.setData('text/plain', uuid.value)
}
</script>

<template>
  <div class="flex items-center">
    <template v-if="isHttps(url) || isLocalhost(url)">
      <img
        v-if="!isLoading"
        :src="url"
        style="width: 100%; height: 100%; object-fit: contain;"
        draggable="true"
        @dragstart="onDragStart"
      >
      <div
        v-else
        class="i-fa6-solid:spinner flex-1"
      />
    </template>
    <span
      v-else
      class="p-1"
    >
      The image resource is not served with HTTPS.
      Please click the URL button to view it.
    </span>
  </div>
</template>
