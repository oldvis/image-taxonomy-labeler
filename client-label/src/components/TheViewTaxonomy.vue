<script setup lang="ts">
import type { TreeNode } from '~/builtins/label-tasks/taxonomization/useLabelTask'
import { storeToRefs } from 'pinia'
import { useLabelTask } from '~/builtins/label-tasks/taxonomization/useLabelTaskWithForest'
import { useOperators } from '~/builtins/label-tasks/taxonomization/useOperators'
import { useStore as useSelectorStore } from '~/stores/selector'
import { useStore as useUserStore } from '~/stores/user'
import { useStore as useWorkspaceStore } from '~/stores/workspace'
import VTreeView from './VTreeView/VTreeView.vue'

const {
  clearCategorySelectors,
  isCategorySelected,
  toggleCategorySelector,
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

/** Allow clustering of all images only when there exist no label categories. */
const isCategoriesEmpty = computed(() => (categories.value.length !== 0))

/**
 * Whether a node editing operation is currently under computation.
 * If so, all the other node editing operations should be disabled.
 */
const isEditing = ref(false)

/** Divide a node in the tree. */
const onNodeDivide = async (node?: TreeNode) => {
  isEditing.value = true
  await divideTaxon(node?.name)
  isEditing.value = false
}

/** Add a new node to the tree. */
const onNodeAppend = (parent?: TreeNode) => {
  isEditing.value = true
  createTaxonEmpty(parent)
  isEditing.value = false
}

/** Build a group consisting of all the ungrouped nodes. */
const onGroupUngrouped = (): void => {
  const unlabeledUuids = uuidsLoaded.value.filter((uuid) => !isAnnotated(uuid))
  isEditing.value = true
  createTaxon('ungrouped', unlabeledUuids)
  isEditing.value = false
}

/** Move a node in the tree. */
const onNodeDrop = (
  draggingNode: TreeNode,
  dropNode: TreeNode,
  type: 'before' | 'inner' | 'after' | 'merge',
): void => {
  isEditing.value = true
  if (type === 'merge') mergeTaxa(draggingNode, dropNode)
  else moveTaxon(draggingNode, dropNode, type)
  isEditing.value = false
}

/** Rename a node in the tree. */
const onNodeChangeName = (node: TreeNode, newName: string) => {
  const oldName = node.name
  isEditing.value = true
  renameTaxon(node, newName)
  isEditing.value = false

  // If the category is selected, rename the selector.
  if (isCategorySelected(oldName)) {
    toggleCategorySelector(oldName)
    toggleCategorySelector(newName)
  }
}

/** Flatten a node in the tree. */
const onNodeFlatten = (node: TreeNode) => {
  isEditing.value = true
  flattenTaxon(node)
  isEditing.value = false
}

/** Add a data entry selector with the node name. */
const onNodeFilter = ({ name }: TreeNode): void => {
  clearCategorySelectors()
  toggleCategorySelector(name)
}

/** Remove a node in the tree. */
const onNodeRemove = (node: TreeNode) => {
  const { name } = node
  isEditing.value = true
  removeTaxon(node)
  isEditing.value = false

  // TODO: The selectors of all the removed categories should be removed.
  // If the category is selected, remove the selector
  if (isCategorySelected(name)) {
    toggleCategorySelector(name)
  }
}
</script>

<template>
  <div view-container>
    <div
      view-header
      class="items-center"
    >
      <div class="i-fa6-solid:info" />
      <b>Groups</b>
      <button
        icon-btn
        class="i-fa6-solid:code-fork"
        :disabled="isCategoriesEmpty || isEditing"
        title="Divide all the images into multiple clusters"
        @click="onNodeDivide()"
      />
      <button
        icon-btn
        class="i-fa6-solid:plus"
        :disabled="isEditing"
        title="Add a new node"
        @click="onNodeAppend()"
      />
      <button
        icon-btn
        class="i-fa6-solid:recycle"
        :disabled="isEditing"
        title="Group all ungrouped images into a new node"
        @click="onGroupUngrouped()"
      />
      <div class="grow" />
      <div class="flex">
        <div class="border-l px-1">
          #roots:
          <b>{{ forest.length }}</b>
        </div>
        <div class="border-l px-1">
          #nodes:
          <b>{{ categories.length }}</b>
        </div>
      </div>
    </div>
    <div class="text-xl overflow-auto grow">
      <VTreeView
        :forest="forest"
        @node-drop="onNodeDrop"
      >
        <template #default="{ node, dragState }">
          <TheTreeNode
            :node="node"
            :is-dragging-over="(dragState?.draggingOver === node.data) && (dragState?.dragging !== node.data)"
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
