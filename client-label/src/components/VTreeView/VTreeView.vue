<script setup lang="ts">
import type ElementNode from 'element-plus/es/components/tree/src/model/node'
import type { TreeNode } from '~/builtins/label-tasks/taxonomization/useLabelTask'
import { ElTree } from 'element-plus'
import 'element-plus/es/components/tree/style/css'

// NOTE: The ElementNode data structure should not be exposed outside of this component.

defineProps({
  /**
   * The forest of to show.
   * Each node is a root node of a tree in the forest.
   * Note that ElTree edits forest for node drop interaction.
   */
  forest: {
    type: Object as PropType<TreeNode[]>,
    required: true,
  },
})

const emit = defineEmits<{
  (
    e: 'nodeDrop',
    draggingNode: TreeNode,
    dropNode: TreeNode,
    type: 'before' | 'inner' | 'after' | 'merge',
  ): void
}>()

const dragState = ref(null as null | {
  dragging: TreeNode
  draggingOver: TreeNode
  isInMergeZone: boolean
})

const isInMergeZone = ref(false)
const checkInMergeZone = (e: DragEvent) => {
  // The dropped node.
  const target = e.target as HTMLElement

  // The children zone div of the dropped node.
  const elementMergeZone = Array
    .from(target.getElementsByTagName('div'))
    .filter((d) => d.textContent?.trim() === 'merge')[0]

  if (elementMergeZone === undefined) return false

  // Check if the mouse is inside the children zone.
  const { clientX, clientY } = e
  const rect = elementMergeZone.getBoundingClientRect()
  return (
    rect.left < clientX
    && clientX < rect.right
    && rect.top < clientY
    && clientY < rect.bottom
  )
}

const onNodeDragOver = (
  draggingNode: ElementNode,
  dropNode: ElementNode,
  e: DragEvent,
): void => {
  isInMergeZone.value = checkInMergeZone(e)
  dragState.value = {
    dragging: draggingNode.data as TreeNode,
    draggingOver: dropNode.data as TreeNode,
    isInMergeZone: isInMergeZone.value,
  }
}

const onNodeDragEnd = (
  draggingNode: ElementNode,
  dropNode: ElementNode | null,
  type: 'before' | 'inner' | 'after' | 'none',
): void => {
  dragState.value = null
  // NOTE: When the dragging node and the drop node are the same, the type can be 'none'.
  if (dropNode === null || type === 'none') return
  const _type = (type === 'inner' && isInMergeZone.value) ? 'merge' : type
  const draggingData = draggingNode.data as TreeNode
  const dropData = dropNode.data as TreeNode
  emit('nodeDrop', draggingData, dropData, _type)
}
</script>

<template>
  <ElTree
    :data="forest"
    :props="{
      label: (data) => `${data.name} (${data.value})`,
    }"
    :draggable="true"
    :default-expand-all="true"
    :expand-on-click-node="false"
    style="color: inherit; background: inherit;"
    @node-drag-over="onNodeDragOver"
    @node-drag-end="onNodeDragEnd"
  >
    <template #default="props">
      <slot
        v-bind="props"
        :drag-state="dragState"
      />
    </template>
  </ElTree>
</template>
