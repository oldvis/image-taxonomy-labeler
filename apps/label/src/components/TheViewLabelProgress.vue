<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLabelTask as useClassification } from '~/builtins/label-tasks/classification/useLabelTask'
import { useStore as useWorkspaceStore } from '~/stores/workspace'

const { annotationsByValue, annotatedUuids } = useClassification()
const { visualizationsLoaded: visualizations } = storeToRefs(useWorkspaceStore())

const nUnlabeled = computed(() => (visualizations.value.length - annotatedUuids.value.size))
const nUnsure = computed(() => (annotationsByValue.value.Unsure?.length ?? 0))
const nSure = computed(() => (annotationsByValue.value.Sure?.length ?? 0))
</script>

<template>
  <div
    class="flex gap-1 px-1 select-none"
    border="~ gray-200"
  >
    <div class="flex gap-1 text-sm">
      <div class="i-fa6-solid:list-check my-auto" />
      <div class="font-bold my-auto">
        Progress
      </div>
    </div>
    <div class="flex gap-1 text-sm">
      <template
        v-for="(d, i) in [
          { title: '#Not-Checked:', value: `${nUnlabeled}` },
          { title: '#Unsure:', value: `${nUnsure}` },
          { title: '#Sure:', value: `${nSure}` },
        ]" :key="d.title"
      >
        <div v-if="i === 0" class="border-l my-1" />
        <div class="flex gap-1 my-auto grow">
          {{ d.title }}
          <div class="font-bold">
            {{ d.value }}
          </div>
        </div>
        <div class="border-l my-1" />
      </template>
    </div>
    <div class="grow" />
    <TheViewLabelProgressButtons />
  </div>
</template>
