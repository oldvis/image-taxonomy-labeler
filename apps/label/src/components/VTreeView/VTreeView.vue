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

/**
 * Opacity of the node being dragged, including the native HTML5 drag image.
 *
 * Stay at or below 0.35: 0.5 still covers the drop candidate's name and
 * merge/multi chips, so you cannot see where the drop will land.
 */
const TREE_NODE_DRAG_OPACITY = 0.3

const dragState = ref(null as null | {
  dragging: TreeNode
  draggingOver: TreeNode
  isInnerDrop: boolean
  isInMergeZone: boolean
})

let draggingEl: HTMLElement | null = null

const fadeDraggingEl = (el: HTMLElement | null): void => {
  if (draggingEl !== null && draggingEl !== el) {
    draggingEl.style.opacity = ''
  }
  draggingEl = el
  if (draggingEl !== null) {
    draggingEl.style.opacity = String(TREE_NODE_DRAG_OPACITY)
  }
}

const clearDraggingEl = (): void => {
  if (draggingEl !== null) {
    draggingEl.style.opacity = ''
    draggingEl = null
  }
}

const isInMergeZone = ref(false)
const rowForNodeDrag = (target: EventTarget | null): Element | null => {
  if (!(target instanceof Element)) return null
  // ElTree disables pointer-events on row children while dragging, so
  // dragover often lands on the content wrapper, not the slot root.
  return target.closest('[data-tree-row]') ?? target.querySelector('[data-tree-row]')
}

const checkInMergeZone = (e: DragEvent) => {
  const row = rowForNodeDrag(e.target)
  const elementMergeZone = row?.querySelector('[data-merge-zone]') ?? null
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

/** ElTree sets this class after it chooses inner vs before/after (blue line). */
const isElTreeInnerDrop = (e: DragEvent): boolean => (
  e.target instanceof Element
  && e.target.closest('.el-tree-node.is-drop-inner') != null
)

/** ElTree draws before/after at the expand-icon edges, so after(A) and
 *  before(B) sit at different Ys in the same gap. Snap to the content seam. */
const snapDropIndicatorToRowSeam = (e: DragEvent): void => {
  if (isElTreeInnerDrop(e) || !(e.target instanceof Element)) return
  const content = e.target.closest('.el-tree-node__content')
  const tree = e.target.closest('.el-tree')
  const indicator = tree?.querySelector('.el-tree__drop-indicator')
  if (
    !(content instanceof HTMLElement)
    || !(tree instanceof HTMLElement)
    || !(indicator instanceof HTMLElement)
  ) {
    return
  }
  if (getComputedStyle(indicator).display === 'none') return

  const treeRect = tree.getBoundingClientRect()
  const contentRect = content.getBoundingClientRect()
  const dropIsBefore = e.clientY < contentRect.top + contentRect.height / 2
  const seam = dropIsBefore ? contentRect.top : contentRect.bottom
  indicator.style.top = `${seam - treeRect.top + tree.scrollTop}px`
}

const onNodeDragStart = (
  draggingNode: ElementNode,
  e: DragEvent,
): void => {
  dragState.value = {
    dragging: draggingNode.data as TreeNode,
    draggingOver: draggingNode.data as TreeNode,
    isInnerDrop: false,
    isInMergeZone: false,
  }
  // Fade during dragstart so the browser's drag image is also translucent.
  const host = e.currentTarget instanceof HTMLElement
    ? e.currentTarget
    : (e.target instanceof Element ? e.target.closest('[draggable="true"]') : null)
  fadeDraggingEl(host instanceof HTMLElement ? host : null)
}

const onNodeDragOver = (
  draggingNode: ElementNode,
  dropNode: ElementNode,
  e: DragEvent,
): void => {
  const isInnerDrop = isElTreeInnerDrop(e)
  isInMergeZone.value = isInnerDrop && checkInMergeZone(e)
  dragState.value = {
    dragging: draggingNode.data as TreeNode,
    draggingOver: dropNode.data as TreeNode,
    isInnerDrop,
    isInMergeZone: isInMergeZone.value,
  }
  snapDropIndicatorToRowSeam(e)
}

const onNodeDragEnd = (
  draggingNode: ElementNode,
  dropNode: ElementNode | null,
  type: 'before' | 'inner' | 'after' | 'none',
): void => {
  clearDraggingEl()
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
    @node-drag-start="onNodeDragStart"
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
