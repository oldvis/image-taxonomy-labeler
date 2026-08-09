<script setup lang="ts">
import type { TreeNode } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/useLabelTask'
import type ElementNode from 'element-plus/es/components/tree/src/model/node'
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
  const target = e.target
  if (!(target instanceof Element)) return false

  // Prefer the tree-node content root so hovering the merge chip itself still works.
  const content = target.closest('.el-tree-node__content') ?? target
  const elementMergeZone = content.querySelector('[data-merge-zone]')
  if (elementMergeZone === null) return false

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
    empty-text="No groups"
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

<style scoped>
:deep(.el-tree__empty-block) {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
:deep(.el-tree__empty-text) {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #6b7280;
}
:global(html.dark) :deep(.el-tree__empty-text),
:global(.dark) :deep(.el-tree__empty-text) {
  color: #9ca3af;
}
</style>
