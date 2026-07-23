<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStore as useSelectorStore } from '~/stores/selector'
import { useStore as useWorkspaceStore } from '~/stores/workspace'
import VHeader from '../VHeader.vue'
import VPagination from '../VPagination.vue'
import VBody from './VBody.vue'

const { visualizationsLoaded: visualizations } = storeToRefs(useWorkspaceStore())

const selectorStore = useSelectorStore()
const { selectors } = storeToRefs(selectorStore)
/** The visualizations that match the selectors. */
const matched = computed(() => (
  selectorStore.applySelectors(visualizations.value)
))

const content = ref<HTMLDivElement>()

/** The number of shown visualizations. */
const pageSize = ref(1)

/** The current page index (the first page's index is 1). */
const currentPage = ref(1)

// When the matched visualizations change, reset the current page.
watch(matched, () => currentPage.value = 1)

/** The visualizations that should be shown. */
const shown = computed(() => (
  matched.value.slice(
    (currentPage.value - 1) * pageSize.value,
    (currentPage.value - 1) * pageSize.value + pageSize.value,
  )
))
</script>

<template>
  <div
    view-container
    class="flex flex-col"
  >
    <VHeader
      :n-total="visualizations.length"
      :n-matched="selectors.length !== 0 ? matched.length : null"
      :n-in-page="shown.length"
    />
    <div
      v-if="shown.length !== 0"
      ref="content"
      flex="~ col"
      class="overflow-auto scroll-smooth flex-1"
    >
      <VBody :data-objects="shown" />
      <div class="grow" />
      <div class="m-1 gap-1 flex">
        <VPagination
          v-model="currentPage"
          :page-count="Math.ceil(matched.length / pageSize)"
        />
      </div>
    </div>
    <div
      v-else
      class="m-auto text-xl"
    >
      No Entries Matched
    </div>
  </div>
</template>
