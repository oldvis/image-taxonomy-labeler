<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { DisplayMode, useStore } from '~/stores/mode'

const { displayMode } = storeToRefs(useStore())
</script>

<template>
  <div
    class="grow overflow-auto m-1 gap-1"
    flex="~ col"
  >
    <TheViewSelectors />
    <TheViewTaxonomies
      v-show="displayMode === DisplayMode.Trees"
      class="grow"
    />
    <TheDataDisplay
      v-show="displayMode === DisplayMode.Images"
      class="grow"
    />
    <TheViewLabelProgress />
  </div>
</template>
