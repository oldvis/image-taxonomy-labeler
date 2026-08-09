<script setup lang="ts">
import { useSignInNotice } from '~/composables/useSignInNotice'

const { notifyIfUnsigned } = useSignInNotice()
onMounted(() => notifyIfUnsigned())
</script>

<template>
  <div
    class="grow min-h-0 overflow-auto"
    flex="~ col"
  >
    <TheViewSelectors class="shrink-0" />
    <div
      class="grow gap-2 p-2 overflow-auto min-h-0"
      flex="~ row"
    >
      <TheViewTaxonomy class="basis-1/3 min-h-0 min-w-0" />
      <TheDataDisplay class="basis-2/3 min-h-0 min-w-0" />
    </div>
    <TheViewLabelProgress class="shrink-0" />
  </div>
</template>
