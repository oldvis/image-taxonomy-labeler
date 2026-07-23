<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLabelTask as useClassification } from '~/builtins/label-tasks/classification/useLabelTask'
import { useStore as useUserStore } from '~/stores/user'

defineProps({
  uuid: {
    type: String as PropType<string>,
    required: true,
  },
})

const {
  annotationsByUuid,
  addAnnotation,
  removeAnnotation,
} = useClassification()
const { name: userName } = storeToRefs(useUserStore())

const isClassified = (uuid: string, category: string): boolean => {
  if (!(uuid in annotationsByUuid.value)) return false
  return annotationsByUuid.value[uuid].some((d) => (d.value === category))
}

const clickCategory = (uuid: string, category: string): void => {
  if (!isClassified(uuid, category)) addAnnotation(uuid, category, userName.value)
  else removeAnnotation(uuid, category)
}
</script>

<template>
  <div class="flex flex-row gap-2">
    <button
      btn
      bg="neutral-600 hover:neutral-700"
      title="Not sure if the annotation is accurate"
      :ring="isClassified(uuid, 'Unsure') ? '2 black dark:white' : ''"
      @click="clickCategory(uuid, 'Unsure')"
    >
      <div>Unsure</div>
    </button>
    <button
      btn
      bg="blue-400 hover:blue-500"
      title="Sure that the annotation is accurate"
      :ring="isClassified(uuid, 'Sure') ? '2 black dark:white' : ''"
      @click="clickCategory(uuid, 'Sure')"
    >
      <div>Sure</div>
    </button>
  </div>
</template>
