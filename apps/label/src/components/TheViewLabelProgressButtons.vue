<script setup lang="ts">
import type { Annotation } from '@image-taxonomy-labeler/ui/label-tasks/types'
import { useLabelTask as useClassification } from '@image-taxonomy-labeler/ui/label-tasks/classification/useLabelTask'
import { buildForest } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/utils'
import { storeToRefs } from 'pinia'
import { useLabelTask as useTaxonomization } from '~/builtins/label-tasks/taxonomization/useLabelTaskWithForest'
import { saveJsonFile, uploadJsonFile } from '~/plugins/file'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useWorkspaceStore } from '~/stores/workspace'

interface TaskProgress {
  taskName: string
  categories: unknown[]
  annotations: Annotation[]
}

const taskComposables = [
  useClassification,
  useTaxonomization,
]
const taskNameToTaskComposable = computed(() => (
  Object.fromEntries(taskComposables.map((d) => [d().taskName, d]))
))
const progresses = computed(() => (
  taskComposables.map((d) => {
    const { taskName, categories, annotations } = d()
    return {
      taskName,
      categories: categories.value,
      annotations: annotations.value,
    }
  })
))

const getLocaleTimeStr = (): string => {
  const d = new Date()
  return `${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`
}

const save = () => {
  saveJsonFile(progresses.value, `annotations-${getLocaleTimeStr()}.json`)
}

const { uuidsLoaded } = storeToRefs(useWorkspaceStore())
const { addErrorMessage } = useMessageStore()
const upload = async () => {
  let loadedProgresses: TaskProgress[]
  try {
    const loaded = await uploadJsonFile()
    if (loaded == null) return
    if (!Array.isArray(loaded)) {
      throw new TypeError('Invalid JSON file')
    }
    loadedProgresses = loaded as TaskProgress[]
  }
  catch {
    addErrorMessage('Invalid JSON file')
    return
  }

  loadedProgresses.forEach((d) => {
    const { taskName } = d
    const taskComposable = taskNameToTaskComposable.value[taskName]
    const { categories, setAll } = taskComposable()
    categories.value = d.categories as string[] | { name: string, children: string[] }[]
    setAll(d.annotations)
  })
  const { categories, forest } = useTaxonomization()
  forest.value = buildForest(categories.value)

  // Load the UUIDs of images in the loaded progresses to the workspace.
  uuidsLoaded.value = [...new Set(loadedProgresses.flatMap(
    (d) => d.annotations.map((d) => d.subject),
  ))]
}
</script>

<template>
  <div class="flex gap-1 my-1">
    <button
      btn
      title="Download the current labeling progress as a JSON file"
      @click="save"
    >
      download
    </button>
    <button
      btn
      title="Upload a JSON file to restore the labeling progress"
      @click="upload"
    >
      upload
    </button>
  </div>
</template>
