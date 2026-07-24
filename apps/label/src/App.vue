<script setup lang="ts">
import { useLabelTask as useClassification } from '@image-taxonomy-labeler/ui/label-tasks/classification/useLabelTask'

const { categories } = useClassification()
categories.value = ['Unsure', 'Sure']
</script>

<template>
  <main
    class="h-full w-full"
    flex="~ col"
  >
    <TheNavBar />
    <RouterView />
    <VMessages />
  </main>
</template>
