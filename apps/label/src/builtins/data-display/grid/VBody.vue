<script setup lang="ts">
import type { Visualization } from '@image-taxonomy-labeler/shared/plugins/visualization'
import { assignGrid } from '@image-taxonomy-labeler/shared/services/layout'
import { USE_ALGORITHM_SERVICE } from '@image-taxonomy-labeler/shared/services/params'
import { watchDebounced } from '@vueuse/core'
import VDatumTooltip from '../VDatumTooltip.vue'
import VDatum from './VDatum.vue'

const props = defineProps({
  /** The data objects to be rendered. */
  dataObjects: {
    type: Array as PropType<Visualization[]>,
    required: true,
  },
})

const { dataObjects } = toRefs(props)

const shape = computed(() => {
  const n = dataObjects.value.length
  const aspectRatio = 2
  let nRows = Math.ceil(Math.sqrt(n / aspectRatio))
  let nCols = Math.ceil(Math.sqrt(n * aspectRatio))
  while (nRows * nCols > n) {
    if ((nRows >= 2) && ((nRows - 1) * nCols >= n)) {
      nRows -= 1
      continue
    }
    else if ((nCols >= 2) && (nRows * (nCols - 1) >= n)) {
      nCols -= 1
    }
    break
  }
  return { nRows, nCols }
})

const uuid2cell = ref<Record<string, [number, number]>>()
/** True when dense layout cannot run without the local algorithm server. */
const needsLocalServer = ref(!USE_ALGORITHM_SERVICE)
const gridEl = ref<HTMLElement>()
let assignGen = 0

const updateAssignment = async () => {
  const gen = ++assignGen
  // Keep the previous grid mounted while reassigning so tooltip anchors
  // (and nested tree-select poppers) are not destroyed mid-interaction.
  const uuids = dataObjects.value.map((d) => d.uuid)
  if (uuids.length === 0) {
    uuid2cell.value = {}
    needsLocalServer.value = false
    return
  }
  if (uuids.length === 1) {
    uuid2cell.value = { [uuids[0]]: [0, 0] }
    needsLocalServer.value = false
    return
  }
  if (!USE_ALGORITHM_SERVICE) {
    uuid2cell.value = undefined
    needsLocalServer.value = true
    return
  }
  try {
    const { nRows, nCols } = shape.value
    const assignment = await assignGrid(uuids, nRows, nCols)
    if (gen !== assignGen) return
    uuid2cell.value = Object.fromEntries(
      assignment.map((d, i) => [uuids[i], d]),
    )
    needsLocalServer.value = false
  }
  catch {
    if (gen !== assignGen) return
    uuid2cell.value = undefined
    needsLocalServer.value = true
  }
}

watchDebounced(dataObjects, () => {
  void updateAssignment()
}, {
  debounce: 150,
  immediate: true,
})
onUnmounted(() => {
  assignGen += 1
})

const tooltipVisible = ref(false)
const activeTarget = ref<HTMLElement>()
const activeDatum = ref<Visualization>()

const clearTooltip = () => {
  tooltipVisible.value = false
  activeTarget.value = undefined
  activeDatum.value = undefined
}

/** Re-bind tooltip to the current cell DOM for activeDatum.uuid. */
const rebindTooltipAnchor = async () => {
  if (!tooltipVisible.value || activeDatum.value === undefined) return
  await nextTick()
  const uuid = activeDatum.value.uuid
  const stillShown = dataObjects.value.some((d) => d.uuid === uuid)
  if (!stillShown) {
    clearTooltip()
    return
  }
  const el = gridEl.value?.querySelector(`[data-uuid="${uuid}"]`)
  if (el instanceof HTMLElement) {
    activeTarget.value = el
    const next = dataObjects.value.find((d) => d.uuid === uuid)
    if (next !== undefined) activeDatum.value = next
  }
  else {
    clearTooltip()
  }
}

watch(uuid2cell, () => {
  void rebindTooltipAnchor()
})

watch(dataObjects, () => {
  void rebindTooltipAnchor()
})

const openTooltip = (e: MouseEvent, d: Visualization) => {
  tooltipVisible.value = true
  activeTarget.value = e.currentTarget as HTMLElement
  activeDatum.value = d
}
</script>

<template>
  <div class="flex h-full min-h-0 w-full">
    <div
      v-if="uuid2cell !== undefined"
      ref="gridEl"
      class="grid h-full min-h-0 flex-1 gap-0.5 p-0.5"
      :style="{
        'grid-template-columns': `repeat(${shape.nCols},minmax(0,1fr))`,
        'grid-template-rows': `repeat(${shape.nRows},minmax(0,1fr))`,
      }"
    >
      <template v-for="d in dataObjects">
        <VDatum
          v-if="d.uuid in uuid2cell"
          :key="d.uuid"
          :datum="d"
          :page-count="dataObjects.length"
          :data-uuid="d.uuid"
          :style="{
            'grid-row-start': uuid2cell[d.uuid][0] + 1,
            'grid-row-end': uuid2cell[d.uuid][0] + 2,
            'grid-column-start': uuid2cell[d.uuid][1] + 1,
            'grid-column-end': uuid2cell[d.uuid][1] + 2,
          }"
          @click.stop="openTooltip($event, d)"
        />
      </template>
    </div>
    <div
      v-else-if="needsLocalServer"
      class="m-auto text-sm text-gray-500 p-3 text-center dark:text-gray-400"
    >
      Dense layout is only available when the local resource server is connected.
    </div>
    <!-- Outside the grid mount cycle so brief reassignment cannot drop the popper. -->
    <VDatumTooltip
      v-if="activeDatum !== undefined && activeTarget !== undefined"
      v-model:visible="tooltipVisible"
      :datum="activeDatum"
      :virtual-ref="activeTarget"
      enable-labeling
    />
  </div>
</template>
