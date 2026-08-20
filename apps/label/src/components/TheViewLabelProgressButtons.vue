<script setup lang="ts">
import {
  type LabelProgressFile,
  formatLabelProgressError,
  parseLabelProgressFile,
} from '@image-taxonomy-labeler/shared/plugins/labelProgress'
import { useLabelTask as useClassification } from '@image-taxonomy-labeler/ui/label-tasks/classification/useLabelTask'
import { buildForest } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/utils'
import { storeToRefs } from 'pinia'
import { useLabelTask as useTaxonomization } from '~/builtins/label-tasks/taxonomization/useLabelTaskWithForest'
import { saveJsonFile, uploadJsonFile } from '~/plugins/file'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useWorkspaceStore } from '~/stores/workspace'

const taskComposables = [
  useClassification,
  useTaxonomization,
]
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
  let loadedProgresses: LabelProgressFile
  try {
    const loaded = await uploadJsonFile()
    if (loaded == null) return
    loadedProgresses = parseLabelProgressFile(loaded)
  }
  catch (err) {
    addErrorMessage(formatLabelProgressError(err))
    return
  }

  loadedProgresses.forEach((d) => {
    if (d.taskName === 'Classification') {
      const { categories, setAll } = useClassification()
      categories.value = d.categories
      setAll(d.annotations)
      return
    }
    const { categories, setAll } = useTaxonomization()
    categories.value = d.categories
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
  <div class="flex gap-1">
    <button
      type="button"
      btn-secondary
      title="Download the current labeling progress as a JSON file"
      @click="save"
    >
      Download
    </button>
    <button
      type="button"
      btn-secondary
      title="Upload a JSON file to restore the labeling progress"
      @click="upload"
    >
      Upload
    </button>
  </div>
</template>
