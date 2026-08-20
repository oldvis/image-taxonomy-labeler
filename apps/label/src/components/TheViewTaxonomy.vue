<script setup lang="ts">
import type { TreeNode } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/useLabelTask'
import { storeToRefs } from 'pinia'
import { useLabelTask } from '~/builtins/label-tasks/taxonomization/useLabelTaskWithForest'
import { useOperators } from '~/builtins/label-tasks/taxonomization/useOperators'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useSelectorStore } from '~/stores/selector'
import { useStore as useUserStore } from '~/stores/user'
import { useStore as useWorkspaceStore } from '~/stores/workspace'
import VTreeView from './VTreeView/VTreeView.vue'

const {
  clearCategorySelectors,
  isCategorySelected,
  toggleCategorySelector,
  removeCategorySelectors,
} = useSelectorStore()
const {
  categories,
  forest,
  isAnnotated,
} = useLabelTask()
const { uuidsLoaded } = storeToRefs(useWorkspaceStore())
const { name: userName } = storeToRefs(useUserStore())

const {
  createTaxon,
  createTaxonEmpty,
  divideTaxon,
  flattenTaxon,
  mergeTaxa,
  moveTaxon,
  renameTaxon,
  removeTaxon,
} = useOperators(uuidsLoaded, userName)
const { addErrorMessage } = useMessageStore()

/** Allow clustering of all images only when there exist no label categories. */
const isCategoriesEmpty = computed(() => (categories.value.length !== 0))

/**
 * Whether a node editing operation is currently under computation.
 * If so, all the other node editing operations should be disabled.
 */
const isEditing = ref(false)

const withEditingLock = async (fn: () => void | Promise<void>): Promise<void> => {
  isEditing.value = true
  try {
    await fn()
  }
  finally {
    isEditing.value = false
  }
}

/** Divide a node in the tree. */
const onNodeDivide = async (node?: TreeNode) => {
  try {
    await withEditingLock(() => divideTaxon(node?.name))
  }
  catch {
    addErrorMessage('Failed to divide the group. Is the local server running?')
  }
}

/** Add a new node to the tree. */
const onNodeAppend = (parent?: TreeNode) => {
  void withEditingLock(() => {
    createTaxonEmpty(parent)
  })
}

/** Build a group consisting of all the ungrouped nodes. */
const onGroupUngrouped = (): void => {
  const unlabeledUuids = uuidsLoaded.value.filter((uuid) => !isAnnotated(uuid))
  void withEditingLock(() => {
    createTaxon('ungrouped', unlabeledUuids)
  })
}

/** Move a node in the tree. */
const onNodeDrop = (
  draggingNode: TreeNode,
  dropNode: TreeNode,
  type: 'before' | 'inner' | 'after' | 'merge',
): void => {
  void withEditingLock(() => {
    if (type === 'merge') mergeTaxa(draggingNode, dropNode)
    else moveTaxon(draggingNode, dropNode, type)
  })
}

/** Rename a node in the tree. */
const onNodeChangeName = (node: TreeNode, newName: string) => {
  const oldName = node.name
  void withEditingLock(() => {
    renameTaxon(node, newName)
  })

  // If the category is selected, rename the selector.
  if (isCategorySelected(oldName)) {
    toggleCategorySelector(oldName)
    toggleCategorySelector(newName)
  }
}

/** Flatten a node in the tree. */
const onNodeFlatten = (node: TreeNode) => {
  void withEditingLock(() => {
    flattenTaxon(node)
  })
}

/** Add a data entry selector with the node name. */
const onNodeFilter = ({ name }: TreeNode): void => {
  clearCategorySelectors()
  toggleCategorySelector(name)
}

/** Remove a node in the tree. */
const onNodeRemove = (node: TreeNode) => {
  const removedNames = [node.name]
  const queue = [...node.children]
  while (queue.length > 0) {
    const current = queue.shift() as TreeNode
    removedNames.push(current.name)
    queue.push(...current.children)
  }
  void withEditingLock(() => {
    removeTaxon(node)
  })
  removeCategorySelectors(removedNames)
}
</script>

<template>
  <div view-container>
    <div
      view-header
      class="items-center"
    >
      <div class="flex shrink-0 gap-1.5 items-center">
        <div class="i-fa6-solid:info text-gray-500 shrink-0" />
        <span class="strip-label">Groups</span>
      </div>
      <button
        type="button"
        icon-btn
        class="i-fa6-solid:code-fork"
        :disabled="isCategoriesEmpty || isEditing"
        title="Divide all the images into multiple clusters"
        @click="onNodeDivide()"
      />
      <button
        type="button"
        icon-btn
        class="i-fa6-solid:plus"
        :disabled="isEditing"
        title="Add a new node"
        @click="onNodeAppend()"
      />
      <button
        type="button"
        icon-btn
        class="i-fa6-solid:recycle"
        :disabled="isEditing"
        title="Group all ungrouped images into a new node"
        @click="onGroupUngrouped()"
      />
      <div class="grow" />
      <div class="strip-meta flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span>
          <span class="strip-strong">{{ forest.length }}</span>
          {{ forest.length === 1 ? 'root' : 'roots' }}
        </span>
        <span
          class="strip-sep"
          aria-hidden="true"
        >·</span>
        <span>
          <span class="strip-strong">{{ categories.length }}</span>
          {{ categories.length === 1 ? 'node' : 'nodes' }}
        </span>
      </div>
    </div>
    <div class="overflow-auto grow min-h-0">
      <VTreeView
        :forest="forest"
        class="h-full"
        @node-drop="onNodeDrop"
      >
        <template #default="{ node, dragState }">
          <VTreeNode
            :node="node"
            :is-dragging-over="(dragState?.draggingOver === node.data) && (dragState?.dragging !== node.data) && dragState?.isInnerDrop"
            :is-in-merge-zone="(dragState?.draggingOver === node.data) && dragState?.isInMergeZone"
            :is-locked="isEditing"
            @node-append="onNodeAppend"
            @node-change-name="onNodeChangeName"
            @node-divide="onNodeDivide"
            @node-flatten="onNodeFlatten"
            @node-filter="onNodeFilter"
            @node-remove="onNodeRemove"
          />
        </template>
      </VTreeView>
    </div>
  </div>
</template>
