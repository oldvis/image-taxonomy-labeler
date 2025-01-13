<script setup lang="ts">
import { useSignInNotice } from '~/composables/useSignInNotice'

useSignInNotice()
</script>

<template>
  <div
    class="grow overflow-auto m-1 gap-1"
    flex="~ col"
  >
    <TheViewSelectors />
    <div
      class="grow gap-1 overflow-auto"
      flex="~ row"
    >
      <TheViewTaxonomy class="basis-1/3" />
      <TheDataDisplay class="basis-2/3" />
    </div>
    <TheViewLabelProgress />
  </div>
</template>
