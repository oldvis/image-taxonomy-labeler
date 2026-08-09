<script setup lang="ts">
import type { Visualization } from '@image-taxonomy-labeler/shared/plugins/visualization'
import type { PropType } from 'vue'
import { isDark } from '@image-taxonomy-labeler/ui/composables/dark'
import { onClickOutside } from '@vueuse/core'
import { ElTooltip } from 'element-plus'
import { toRefs } from 'vue'
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
  /** When true, tooltip body includes taxonomy + Sure/Unsure controls. */
  enableLabeling: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
})
const emit = defineEmits<{
  /** Emitted when the tooltip is closed. */
  (e: 'update:visible', d: boolean): void
}>()

const { datum } = toRefs(props)
const contentRoot = ref<HTMLElement>()
const ignoreVirtualRef = toRef(props, 'virtualRef')

/** Close on outside click, but keep open for cell re-anchor and teleported selects. */
onClickOutside(
  contentRoot,
  () => {
    if (props.visible) emit('update:visible', false)
  },
  {
    ignore: [
      ignoreVirtualRef,
      '.el-popper',
      '.el-select-dropdown',
      '.el-tree-select__popper',
    ],
  },
)
</script>

<template>
  <ElTooltip
    :effect="isDark ? 'dark' : 'light'"
    :visible="visible"
    :virtual-ref="virtualRef"
    placement="left"
    virtual-triggering
    persistent
  >
    <template #content>
      <div ref="contentRoot">
        <VDatumTooltipBody
          :datum="datum"
          :enable-labeling="enableLabeling"
          @update:visible="emit('update:visible', $event)"
        />
      </div>
    </template>
  </ElTooltip>
</template>
