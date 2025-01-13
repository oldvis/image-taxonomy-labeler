<script setup lang="ts">
import type { TreeNodeWithUsers } from '~/stores/profile'
import { onClickOutside } from '@vueuse/core'
import VBarColumns from './VIndentedTree/VBarColumns.vue'
import VIndentedTree from './VIndentedTree/VIndentedTree.vue'
import VTextColumns from './VIndentedTree/VTextColumns.vue'
import VInput from './VInput.vue'

const props = defineProps({
  /** The forest to plot (Assume the forest has only one tree). */
  forest: {
    type: Array as PropType<TreeNodeWithUsers[]>,
    required: true,
  },
  /** The label of the forest. */
  label: {
    type: String as PropType<string>,
    required: true,
  },
  /** The function for computing a tree node's text class. */
  treeTextClassMap: {
    type: Function as PropType<(d: TreeNodeWithUsers) => string>,
    required: true,
  },
  /**
   * The configuration for the text columns.
   * - `value`: The function for computing the text value for each node.
   * - `x`: The horizontal offset of the text column.
   * - `textAnchor`: The text anchor of the text element.
   * - `class`: The class of the text element.
   */
  textColumns: {
    type: Array as PropType<{
      value: (d: TreeNodeWithUsers) => string
      x: number
      textAnchor: 'start' | 'middle' | 'end'
      class: string
    }[]>,
    required: true,
  },
  /**
   * The configuration for the bar columns.
   * - `value`: The function for computing the bar value for each node.
   * - `x`: The horizontal offset of the bar column.
   * - `class`: The class of the bar element.
   * - `domain`: The value domain of the bar column.
   * - `barWidth`: The max width of the bar element.
   */
  barColumns: {
    type: Array as PropType<{
      value: (d: TreeNodeWithUsers) => number
      x: number
      class: string
      domain: [number, number]
      barWidth: number
    }[]>,
    required: true,
  },
  /** Whether to show the toolbar. */
  showToolbar: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
})

const emit = defineEmits<{
  (e: 'hoverNode', name: string): void
  (e: 'leaveNode', name: string): void
  (e: 'clickNode', name: string): void
  (e: 'remove'): void
  (e: 'update:label', newValue: string): void
}>()

const svgSingleTreeWidth = 265

const input = ref<HTMLInputElement>()
const isEditable = ref(false)
onClickOutside(input, () => {
  isEditable.value = false
})
const onClickEdit = () => {
  isEditable.value = true
}

const submit = (newValue: string, e: Event): void => {
  const label = props.label

  // Trigger value update only when the value is changed.
  if (label !== newValue) {
    emit('update:label', newValue)
    isEditable.value = false
  }

  // When pressing enter, make the input non-editable.
  const isKeypressEnter = (e instanceof KeyboardEvent) && (e.key === 'Enter')
  if (isKeypressEnter) {
    isEditable.value = false
  }
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex items-center">
      <div class="text-lg">
        <div
          v-if="!isEditable"
          class="pointer-events-none"
        >
          {{ label }}
        </div>
        <VInput
          v-else
          ref="input"
          :value="label"
          @update:value="submit"
        />
      </div>
      <template v-if="showToolbar">
        <div class="grow" />
        <div class="flex gap-1">
          <button
            icon-btn
            class="i-fa6-solid:pencil"
            title="Edit the label"
            @click="onClickEdit"
          />
          <button
            icon-btn
            class="i-fa6-solid:trash"
            title="Remove the annotations"
            @click="emit('remove')"
          />
        </div>
      </template>
    </div>
    <VIndentedTree
      :data="forest[0]"
      :width="svgSingleTreeWidth"
      :text-class-map="treeTextClassMap"
      @hover-node="emit('hoverNode', $event)"
      @leave-node="emit('leaveNode', $event)"
      @click-node="emit('clickNode', $event)"
    >
      <template #node="{ node }">
        <VTextColumns
          :node="node"
          :columns="textColumns"
        />
        <VBarColumns
          :node="node"
          :columns="barColumns"
        />
      </template>
    </VIndentedTree>
  </div>
</template>
