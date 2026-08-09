<script setup lang="ts">
import { useLabelTask as useClassification } from '@image-taxonomy-labeler/ui/label-tasks/classification/useLabelTask'
import { storeToRefs } from 'pinia'
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
  <div class="flex flex-row gap-1">
    <button
      type="button"
      :class="isClassified(uuid, 'Unsure') ? 'btn-neutral' : 'btn-secondary'"
      title="Not sure if the annotation is accurate"
      @click="clickCategory(uuid, 'Unsure')"
    >
      Unsure
    </button>
    <button
      type="button"
      :class="isClassified(uuid, 'Sure') ? 'pill-on' : 'btn-secondary'"
      title="Sure that the annotation is accurate"
      @click="clickCategory(uuid, 'Sure')"
    >
      Sure
    </button>
  </div>
</template>
