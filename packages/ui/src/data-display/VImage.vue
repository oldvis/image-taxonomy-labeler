<script setup lang="ts">
import type { PropType } from 'vue'
import { isHttps, isLocalhost } from '@image-taxonomy-labeler/shared/services/url'
import { useImage } from '@vueuse/core'
import { computed, toRefs } from 'vue'

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

/** Must match the MIME checked by Groups tree drop handlers. */
const IMAGE_DRAG_MIME = 'application/x-oldvis-image'

const { url, uuid } = toRefs(props)
const { isLoading, error } = useImage(computed(() => ({ src: url.value })))

const canShowImage = computed(() => isHttps(url.value) || isLocalhost(url.value))
const isLocalResource = computed(() => isLocalhost(url.value))
const urlActionHref = computed((): string | null => {
  if (url.value === '') return null
  try {
    const protocol = new URL(url.value).protocol
    return protocol === 'http:' || protocol === 'https:' ? url.value : null
  }
  catch {
    return null
  }
})

const onDragStart = (e: DragEvent): void => {
  if (uuid.value === '') return
  e.dataTransfer?.setData(IMAGE_DRAG_MIME, uuid.value)
  e.dataTransfer?.setData('text/plain', uuid.value)
}
</script>

<template>
  <div
    class="flex h-full w-full min-h-0 items-center justify-center overflow-hidden border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950"
  >
    <template v-if="canShowImage">
      <div
        v-if="isLoading"
        class="i-fa6-solid:spinner animate-spin"
      />
      <span
        v-else-if="error"
        class="p-3 text-center text-gray-600 dark:text-gray-300"
      >
        <template v-if="isLocalResource">
          Image failed to load.
          Please launch the local resource server.
        </template>
        <template v-else>
          Image failed to load.
          Please use
          <a
            v-if="urlActionHref !== null"
            class="text-teal-700 underline underline-offset-2 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200"
            :href="urlActionHref"
            target="_blank"
            rel="noopener noreferrer"
          >URL</a>
          <template v-else>
            URL
          </template>
          to view it.
        </template>
      </span>
      <img
        v-else
        :src="url"
        class="h-full w-full object-contain"
        draggable="true"
        @dragstart="onDragStart"
      >
    </template>
    <span
      v-else
      class="p-3 text-center text-gray-600 dark:text-gray-300"
    >
      The image is served over HTTP (not HTTPS).
      Please use
      <a
        v-if="urlActionHref !== null"
        class="text-teal-700 underline underline-offset-2 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200"
        :href="urlActionHref"
        target="_blank"
        rel="noopener noreferrer"
      >URL</a>
      <template v-else>
        URL
      </template>
      to view it.
    </span>
  </div>
</template>
