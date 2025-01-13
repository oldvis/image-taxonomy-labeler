<script setup lang="ts">
import type { Visualization } from '~/plugins/visualization'
import VDatum from './VDatum.vue'

defineProps({
  /** The data objects to be rendered. */
  dataObjects: {
    type: Array as PropType<Visualization[]>,
    required: true,
  },
})
</script>

<template>
  <div class="overflow-auto">
    <VDatum
      v-for="d in dataObjects"
      :key="d.uuid"
      :datum="d"
      class="flex-1 m-1"
    >
      <div
        flex="~ col"
        class="my-2 gap-2"
      >
        <TheWidgetTaxonomization :uuid="d.uuid" />
        <TheWidgetClassification :uuid="d.uuid" />
      </div>
    </VDatum>
  </div>
</template>
