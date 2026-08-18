<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { DisplayMode, useStore } from '~/stores/mode'

const { displayMode } = storeToRefs(useStore())
</script>

<template>
  <div
    class="grow min-h-0 overflow-auto"
    flex="~ col"
  >
    <TheViewSelectors class="shrink-0" />
    <TheViewTaxonomies
      v-show="displayMode === DisplayMode.Trees"
      class="grow min-h-0 m-2"
    />
    <TheDataDisplay
      v-show="displayMode === DisplayMode.Images"
      class="grow min-h-0 m-2"
    />
    <TheViewLabelProgress class="shrink-0" />
  </div>
</template>
