<script setup lang="ts">
import type { Selector } from '~/stores/selector'
import { SelectorType } from '~/stores/selector'

const props = defineProps({
  selector: {
    type: Object as PropType<Selector>,
    required: true,
  },
})
const emit = defineEmits<{
  (e: 'removeSelector', d: Selector<SelectorType>): void
}>()

const { selector } = toRefs(props)

const text = computed(() => {
  if (selector.value.type === SelectorType.Category) {
    return `category: '${(selector.value as Selector<SelectorType.Category>).query}'`
  }
  if (selector.value.type === SelectorType.Fuse) {
    return `search: '${(selector.value as Selector<SelectorType.Fuse>).query.pattern}'`
  }
  if (selector.value.type === SelectorType.Unsure) {
    return 'Unsure'
  }
  if (selector.value.type === SelectorType.Consensus) {
    return 'Consensus'
  }
  if (selector.value.type === SelectorType.Dissensus) {
    return 'Dissensus'
  }
  return ''
})
</script>

<template>
  <div class="border flex gap-1 px-1">
    {{ text }}
    <button
      icon-btn
      title="Remove"
      @click="emit('removeSelector', selector)"
    >
      <div class="i-fa6-solid:xmark m-auto" />
    </button>
  </div>
</template>
