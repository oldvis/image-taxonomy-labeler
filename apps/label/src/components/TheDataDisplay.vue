<script setup lang="ts">
import VPagination from '@image-taxonomy-labeler/ui/components/VPagination.vue'
import { useLabelTask as useClassification } from '@image-taxonomy-labeler/ui/label-tasks/classification/useLabelTask'
import { useLabelTask as useTaxonomization } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/useLabelTask'
import { useElementSize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import VColumnsBody from '~/builtins/data-display/columns/VBody.vue'
import VGridBody from '~/builtins/data-display/grid/VBody.vue'
import VSingleObjectBody from '~/builtins/data-display/single-object/VBody.vue'
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

const layout = ref<'columns' | 'single' | 'grid'>('columns')

/** The number of visualizations shown per page. */
const pageSize = computed(() => {
  if (layout.value === 'single') return 1
  if (layout.value === 'columns') return 25
  if (layout.value === 'grid') return 300
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

const { isAnnotated: isClassified } = useClassification()
const { isAnnotated: isTaxonomized } = useTaxonomization()
/** Grouped/labeled for the Entries header: has Sure/Unsure or any taxonomy. */
const isAnnotated = (uuid: string): boolean => (
  isClassified(uuid) || isTaxonomized(uuid)
)

const nInPageLabeled = computed(() => (
  shown.value.filter((d) => isAnnotated(d.uuid)).length
))

/**
 * Jump target for "Go to first unmarked".
 *
 * Use classification only (Sure/Unsure), not taxonomy. Load always assigns a
 * batch taxon (`new batch`), so requiring "no taxonomy" would disable this
 * control for every loaded image. Aligns with Progress "unmarked".
 */
const firstUnmarkedPage = computed((): number | null => {
  const index = matched.value.findIndex((d) => !isClassified(d.uuid))
  if (index === -1) return null
  return Math.floor(index / pageSize.value) + 1
})

const gotoFirstUnmarked = (): void => {
  const page = firstUnmarkedPage.value
  if (page === null) return
  currentPage.value = page
  if (content.value !== undefined) {
    content.value.scrollTop = 0
  }
}
</script>

<template>
  <div view-container>
    <TheDataDisplayHeader
      v-model="layout"
      :n-total="visualizations.length"
      :n-matched="selectors.length !== 0 ? matched.length : null"
      :n-in-page="shown.length"
      :n-in-page-labeled="nInPageLabeled"
    />
    <div
      v-if="shown.length !== 0"
      ref="content"
      flex="~ col"
      class="overflow-auto scroll-smooth flex-1"
    >
      <div
        class="flex min-h-0"
        :style="`height: calc(100% - ${paginationHeight}px)`"
      >
        <VBody
          class="min-h-0 flex-1"
          :data-objects="shown"
        />
      </div>
      <div ref="pagination">
        <div class="flex items-center gap-1 border-t border-gray-200 px-2 py-1.5 dark:border-gray-700">
          <VPagination
            v-model="currentPage"
            :page-count="Math.ceil(matched.length / pageSize)"
          />
          <button
            type="button"
            btn-secondary
            title="Go to first unmarked (no Sure/Unsure)"
            :disabled="firstUnmarkedPage === null"
            @click="gotoFirstUnmarked"
          >
            Go to first unmarked
          </button>
        </div>
      </div>
    </div>
    <div
      v-else
      class="m-auto text-sm text-gray-500 p-3 dark:text-gray-400"
    >
      No entries matched
    </div>
  </div>
</template>
