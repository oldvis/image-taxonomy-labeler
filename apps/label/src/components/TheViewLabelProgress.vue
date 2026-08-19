<script setup lang="ts">
import { useLabelTask as useClassification } from '@image-taxonomy-labeler/ui/label-tasks/classification/useLabelTask'
import { storeToRefs } from 'pinia'
import { useStore as useWorkspaceStore } from '~/stores/workspace'

const { annotationsByValue, annotatedUuids } = useClassification()
const { visualizationsLoaded: visualizations } = storeToRefs(useWorkspaceStore())

const nUnlabeled = computed(() => (visualizations.value.length - annotatedUuids.value.size))
const nUnsure = computed(() => (annotationsByValue.value.Unsure?.length ?? 0))
const nSure = computed(() => (annotationsByValue.value.Sure?.length ?? 0))
</script>

<template>
  <div class="strip border-t border-gray-200 dark:border-gray-700 select-none">
    <div class="flex shrink-0 gap-1.5 items-center">
      <div class="i-fa6-solid:list-check text-gray-500 my-auto" />
      <span class="strip-label">Progress</span>
    </div>
    <div class="strip-meta flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
      <span>
        unmarked <span class="strip-strong">{{ nUnlabeled }}</span>
      </span>
      <span
        class="strip-sep"
        aria-hidden="true"
      >·</span>
      <span>
        unsure <span class="strip-strong">{{ nUnsure }}</span>
      </span>
      <span
        class="strip-sep"
        aria-hidden="true"
      >·</span>
      <span>
        sure <span class="strip-strong">{{ nSure }}</span>
      </span>
    </div>
    <div class="grow" />
    <TheViewLabelProgressButtons />
  </div>
</template>
