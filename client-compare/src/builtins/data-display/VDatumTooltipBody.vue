<script setup lang="ts">
import type { Visualization } from '~/plugins/visualization'
import { useClipboard } from '@vueuse/core'
import { useStore } from '~/stores/message'

const props = defineProps({
  /** Render the given part of the visualization metadata. */
  datum: {
    type: Object as PropType<Visualization>,
    required: true,
  },
})
const emit = defineEmits<{
  /** Emitted when the tooltip is closed. */
  (e: 'update:visible', d: boolean): void
}>()

const { datum } = toRefs(props)

const { addSuccessMessage } = useStore()
const { copy } = useClipboard()

/** Copy the visualization metadata. */
const onClickCopy = () => {
  copy(JSON.stringify(datum.value))
  addSuccessMessage('Metadata Copied.')
}
</script>

<template>
  <div>
    <div
      flex="~ row"
      style="max-width: 400px;"
    >
      <div>
        <div>
          <b>uuid</b>: {{ datum.uuid }}
        </div>
        <div>
          <b>title</b>: {{ datum.displayName }}
        </div>
        <div>
          <b>author</b>: {{ datum.authors?.join(' / ') ?? 'unknown' }}
        </div>
        <div>
          <b>year</b>: {{ datum.publishDate ?? 'unknown' }}
        </div>
        <div>
          <b>source</b>: {{ datum.source?.name ?? 'unknown' }}
        </div>
        <div>
          <b>language</b>: {{ datum.languages?.join(', ') ?? 'unknown' }}
        </div>
        <div v-if="datum.tags !== undefined && datum.tags.length !== 0">
          <b>tags</b>: {{ datum.tags?.join(', ') }}
        </div>
        <div v-if="datum.abstract !== undefined && datum.abstract !== null">
          <b>abstract</b>: {{ datum.abstract.slice(0, 100) }}...
        </div>
      </div>
      <div class="grow" />
      <div
        icon-btn
        class="i-fa6-solid:xmark"
        @click="emit('update:visible', false)"
      />
    </div>
    <div class="flex gap-1">
      <button
        class="icon-btn flex gap-1"
        title="Copy raw metadata of this entry"
        @click="onClickCopy"
      >
        <div class="i-fa6-solid:copy my-auto" />
        <div class="my-auto">
          copy metadata
        </div>
      </button>
      <a
        title="Visit original URL in a new tab"
        target="_blank"
        :href="datum.viewUrl ?? ''"
      >
        <button class="icon-btn flex gap-1">
          <div class="i-fa6-solid:globe my-auto" />
          <div class="my-auto">url</div>
        </button>
      </a>
      <a
        title="Search title in Google"
        target="_blank"
        :href="`https://www.google.com/search?q=${datum.displayName}`"
      >
        <button class="icon-btn flex gap-1">
          <div class="i-fa6-brands:google my-auto" />
          <div class="my-auto">google</div>
        </button>
      </a>
    </div>
  </div>
</template>
