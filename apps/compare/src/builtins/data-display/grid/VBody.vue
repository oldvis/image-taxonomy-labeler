<script setup lang="ts">
import type { Visualization } from '@image-taxonomy-labeler/shared/plugins/visualization'
import { assignGrid, computeDenseGridShape } from '@image-taxonomy-labeler/shared/services/layout'
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

const shape = computed(() => computeDenseGridShape(dataObjects.value.length))

const uuid2cell = ref<Record<string, [number, number]>>()
/** True when dense layout cannot run without the local algorithm server. */
const needsLocalServer = ref(!USE_ALGORITHM_SERVICE)
let assignGen = 0

const updateAssignment = async () => {
  const gen = ++assignGen
  uuid2cell.value = undefined
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
const nDataObjects = computed(() => dataObjects.value.length)
watch(nDataObjects, () => {
  tooltipVisible.value = false
  activeTarget.value = undefined
  activeDatum.value = undefined
})
</script>

<template>
  <div class="flex h-full min-h-0 w-full">
    <div
      v-if="uuid2cell !== undefined"
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
          :style="{
            'grid-row-start': uuid2cell[d.uuid][0] + 1,
            'grid-row-end': uuid2cell[d.uuid][0] + 2,
            'grid-column-start': uuid2cell[d.uuid][1] + 1,
            'grid-column-end': uuid2cell[d.uuid][1] + 2,
          }"
          @click="(e: MouseEvent) => {
            tooltipVisible = true
            activeTarget = e.currentTarget as HTMLElement
            activeDatum = d
          }"
        >
          <div
            class="flex flex-col gap-0.5 p-0.5 bg-white/80 dark:bg-gray-900/80"
            @click.stop
          >
            <TheWidgetAnnotationComparator :uuid="d.uuid" />
          </div>
        </VDatum>
      </template>
      <VDatumTooltip
        v-if="activeDatum !== undefined && activeTarget !== undefined"
        v-model:visible="tooltipVisible"
        :datum="activeDatum"
        :virtual-ref="activeTarget"
      />
    </div>
    <div
      v-else-if="needsLocalServer"
      class="m-auto text-sm text-gray-500 p-3 text-center dark:text-gray-400"
    >
      Dense layout is only available when the local resource server is connected.
    </div>
  </div>
</template>
