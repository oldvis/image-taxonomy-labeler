<script setup lang="ts">
import type { Visualization } from '~/plugins/visualization'
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
  <div class="gap-1 p-1 overflow-auto grid grid-cols-3">
    <VDatum
      v-for="d in dataObjects"
      :key="d.uuid"
      :datum="d"
      class="mb-1"
      @contextmenu.stop.prevent="(e: MouseEvent) => {
        tooltipVisible = true
        activeTarget = e.currentTarget as HTMLElement
        activeDatum = d as Visualization
      }"
    />
    <VDatumTooltip
      v-if="activeDatum !== undefined && activeTarget !== undefined"
      v-model:visible="tooltipVisible"
      :datum="activeDatum"
      :virtual-ref="activeTarget"
    />
  </div>
</template>
