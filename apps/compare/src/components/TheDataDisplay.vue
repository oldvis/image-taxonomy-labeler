<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import VColumnsBody from '~/builtins/data-display/columns/VBody.vue'
import VGridBody from '~/builtins/data-display/grid/VBody.vue'
import VSingleObjectBody from '~/builtins/data-display/single-object/VBody.vue'
import VPagination from '~/builtins/data-display/VPagination.vue'
import { useStore as useSelectorStore } from '~/stores/selector'
import { useStore as useWorkspaceStore } from '~/stores/workspace'

const { visualizationsLoaded: visualizations } = storeToRefs(useWorkspaceStore())

const selectorStore = useSelectorStore()
const { selectors } = storeToRefs(selectorStore)
/** The visualizations that match the selectors. */
const matched = computed(() => (
  selectorStore.applySelectors(visualizations.value)
))

const content = ref<HTMLDivElement>()
const pagination = ref()
const { height: paginationHeight } = useElementSize(pagination)

const layout = ref<'single' | 'columns' | 'grid'>('single')

/** The number of visualizations shown per page. */
const pageSize = computed(() => {
  if (layout.value === 'single') return 1
  if (layout.value === 'columns') return 25
  if (layout.value === 'grid') return 288
  return 1
})
const VBody = computed(() => {
  if (layout.value === 'single') return VSingleObjectBody
  if (layout.value === 'columns') return VColumnsBody
  if (layout.value === 'grid') return VGridBody
  return VSingleObjectBody
})

/** The current page index (the first page's index is 1). */
const currentPage = ref(1)

// Reset the current page when in the following situations:
// 1. the matched visualizations change
// 2. the layout changes
watch([matched, layout], () => currentPage.value = 1)

/** The visualizations that should be shown. */
const shown = computed(() => (
  matched.value.slice(
    (currentPage.value - 1) * pageSize.value,
    (currentPage.value - 1) * pageSize.value + pageSize.value,
  )
))
</script>

<template>
  <div view-container>
    <TheDataDisplayHeader
      v-model="layout"
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
      <div
        class="flex"
        :style="`height: calc(100% - ${paginationHeight}px)`"
      >
        <VBody
          class="flex-1"
          :data-objects="shown"
        />
      </div>
      <div ref="pagination">
        <div class="gap-1 flex border-t">
          <VPagination
            v-model="currentPage"
            :page-count="Math.ceil(matched.length / pageSize)"
          />
        </div>
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
