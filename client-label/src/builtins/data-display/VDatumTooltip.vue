<script setup lang="ts">
import type { Visualization } from '~/plugins/visualization'
import { ElTooltip } from 'element-plus'
import { isDark } from '~/composables/dark'
import VDatumTooltipBody from './VDatumTooltipBody.vue'
import 'element-plus/es/components/tooltip/style/css'

const props = defineProps({
  /** Render the given part of the visualization metadata. */
  datum: {
    type: Object as PropType<Visualization>,
    required: true,
  },
  /** Whether the tooltip is visible. */
  visible: {
    type: Boolean as PropType<boolean>,
    required: true,
  },
  /** The reference element to which the tooltip is attached. */
  virtualRef: {
    type: Object as PropType<HTMLElement>,
    required: true,
  },
})
const emit = defineEmits<{
  /** Emitted when the tooltip is closed. */
  (e: 'update:visible', d: boolean): void
}>()

const { datum } = toRefs(props)
</script>

<template>
  <ElTooltip
    :effect="isDark ? 'dark' : 'light'"
    :visible="visible"
    :virtual-ref="virtualRef"
    placement="left"
    virtual-triggering
  >
    <template #content>
      <VDatumTooltipBody
        :datum="datum"
        @update:visible="emit('update:visible', $event)"
      />
    </template>
  </ElTooltip>
</template>
