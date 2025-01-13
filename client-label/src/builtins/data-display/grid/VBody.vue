<script setup lang="ts">
import type { Visualization } from '~/plugins/visualization'
import { assignGrid } from '~/services/layout'
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
      continue
    }
    break
  }
  return { nRows, nCols }
})

const uuid2cell = ref<Record<string, [number, number]>>()
const updateAssignment = async () => {
  uuid2cell.value = undefined
  const uuids = dataObjects.value.map((d) => d.uuid)
  const assignment = await assignGrid(uuids, shape.value.nRows, shape.value.nCols)
  uuid2cell.value = Object.fromEntries(
    assignment.map((d, i) => [uuids[i], d]),
  )
}
onMounted(updateAssignment)
watch(dataObjects, updateAssignment)

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
  <div class="flex">
    <div
      v-if="uuid2cell !== undefined"
      class="grid gap-0.5 p-0.5 flex-1"
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
          @contextmenu.stop.prevent="(e) => {
            tooltipVisible = true
            activeTarget = e.currentTarget
            activeDatum = d
          }"
        >
          <div
            flex="~ col"
            class="my-2 gap-2"
          >
            <TheWidgetTaxonomization :uuid="d.uuid" />
            <TheWidgetClassification :uuid="d.uuid" />
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
  </div>
</template>
