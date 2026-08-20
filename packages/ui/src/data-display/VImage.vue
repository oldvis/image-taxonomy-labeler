<script setup lang="ts">
import type { PropType } from 'vue'
import { isHttps, isLocalhost } from '@image-taxonomy-labeler/shared/services/url'
import { useImage } from '@vueuse/core'
import { computed, onUnmounted, ref, toRefs } from 'vue'

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

const isDragging = ref(false)
let dragGhost: HTMLImageElement | null = null

const clearDragGhost = (): void => {
  dragGhost?.remove()
  dragGhost = null
}

/**
 * The browser snapshots the drag preview when dragstart returns, before Vue
 * re-renders the bound opacity class. Style a throwaway clone via the HTML5
 * drag-image API instead of mutating this component's DOM.
 */
const setFadedDragImage = (e: DragEvent): void => {
  const img = e.currentTarget
  const dt = e.dataTransfer
  if (!(img instanceof HTMLImageElement) || dt == null) return
  if (typeof dt.setDragImage !== 'function') return
  clearDragGhost()
  const rect = img.getBoundingClientRect()
  const ghost = img.cloneNode(true) as HTMLImageElement
  ghost.removeAttribute('class')
  ghost.style.opacity = '0.5'
  ghost.style.objectFit = 'contain'
  ghost.style.position = 'absolute'
  ghost.style.left = '-9999px'
  ghost.style.width = `${rect.width}px`
  ghost.style.height = `${rect.height}px`
  document.body.append(ghost)
  dt.setDragImage(ghost, e.offsetX, e.offsetY)
  dragGhost = ghost
}

const onDragStart = (e: DragEvent): void => {
  if (uuid.value === '') return
  e.dataTransfer?.setData(IMAGE_DRAG_MIME, uuid.value)
  e.dataTransfer?.setData('text/plain', uuid.value)
  isDragging.value = true
  setFadedDragImage(e)
}

const onDragEnd = (): void => {
  isDragging.value = false
  clearDragGhost()
}

onUnmounted(clearDragGhost)
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
        :class="{ 'opacity-50': isDragging }"
        draggable="true"
        @dragstart="onDragStart"
        @dragend="onDragEnd"
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
