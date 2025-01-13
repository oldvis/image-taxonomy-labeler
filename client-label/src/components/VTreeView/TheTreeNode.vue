<script setup lang="ts">
import type ElementNode from 'element-plus/es/components/tree/src/model/node'
import type { TreeNode } from '~/builtins/label-tasks/taxonomization/useLabelTask'
import { onClickOutside, useElementHover } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { toRefs } from 'vue'
import { useLabelTask } from '~/builtins/label-tasks/taxonomization/useLabelTask'
import { useOperators } from '~/builtins/label-tasks/taxonomization/useOperators'
import { findCenter } from '~/services/clustering'
import { getThumbnailUrl } from '~/services/image'
import { USE_ALGORITHM_SERVICE } from '~/services/params'
import { useStore as useSelectorStore } from '~/stores/selector'
import { useStore as useUserStore } from '~/stores/user'
import { useStore as useWorkspaceStore } from '~/stores/workspace'
import VInput from './VInput.vue'

const props = defineProps({
  node: {
    type: Object as PropType<ElementNode>,
    required: true,
  },
  /** Whether the user is dragging a tree node over this node. */
  isDraggingOver: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  isInMergeZone: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  /** Whether the node editing operations should be locked. */
  isLocked: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
})
const emit = defineEmits<{
  (e: 'nodeAppend', node: TreeNode): void
  (e: 'nodeChangeName', node: TreeNode, newName: string): void
  (e: 'nodeDivide', node: TreeNode): void
  (e: 'nodeFilter', node: TreeNode): void
  (e: 'nodeFlatten', node: TreeNode): void
  (e: 'nodeRemove', node: TreeNode): void
}>()

const { isCategorySelected } = useSelectorStore()
const { annotationsByValue, annotationsByUuid, categories } = useLabelTask()

const { uuidsLoaded } = storeToRefs(useWorkspaceStore())
const { name: userName } = storeToRefs(useUserStore())
const { assignTaxon, unassignTaxon } = useOperators(uuidsLoaded, userName)

const subjects = computed(() => (
  annotationsByValue.value[props.node.data.name]?.map((d) => d.subject) ?? []
))

/** Get the URL of a thumbnail image representing a group of images. */
const useThumbnail = (uuids: Ref<string[]>) => {
  const centerUuid = ref(null as string | null)
  const updateCenter = async () => {
    centerUuid.value = await findCenter(uuids.value)
  }
  onMounted(updateCenter)
  // For performance consideration, update center only when there is no previous center.
  watch(subjects, (_, oldValue) => {
    if (oldValue.length === 0) updateCenter()
  })
  const url = computed(() => (
    centerUuid.value === null ? undefined : getThumbnailUrl(centerUuid.value)
  ))
  return { url }
}

const { url } = useThumbnail(subjects)

const container = ref<HTMLDivElement>()
const input = ref<HTMLInputElement>()

const isHovered = useElementHover(container)
const isEditable = ref(false)

const data = computed(() => toRefs(props).node.value.data as TreeNode)

const submit = (newValue: string, e: Event): void => {
  // Trigger value update only when the value is changed.
  if (data.value.name !== newValue) {
    emit('nodeChangeName', data.value, newValue)
    isEditable.value = false
  }

  // When pressing enter, make the input non-editable.
  const isKeypressEnter = (e instanceof KeyboardEvent) && (e.key === 'Enter')
  if (isKeypressEnter) {
    isEditable.value = false
  }
}
onClickOutside(input, () => {
  isEditable.value = false
})
const onClickEdit = () => {
  isEditable.value = true
}

/** Whether the user is dragging an image over this node. */
const isDraggingImageOver = ref(false)
const isInMultiLabelZone = ref(false)

/**
 * When an image is dropped.
 * Note that when a node is dropped, the `@drop` event is not triggered.
 */
const onDrop = (e: DragEvent) => {
  isDraggingImageOver.value = false

  // Do not allow image dropping on none-leaf nodes.
  const { node } = toRefs(props)
  if (!node.value.isLeaf) return

  const uuid = e.dataTransfer?.getData('text/plain')
  if (uuid === undefined) return

  if (isInMultiLabelZone.value === true) {
    // Drop as multi-label classification.
    assignTaxon(uuid, data.value.name)
  }
  else {
    // Drop as single-label classification.

    // Unassign the other labels
    const leafCategories = annotationsByUuid.value[uuid]
      .map((d) => d.value)
      .filter((name) => {
        const match = categories.value.find((d) => d.name === name)
        if (match === undefined) return false
        return match.children.length === 0
      })
    leafCategories.forEach((name) => unassignTaxon(uuid, name))

    assignTaxon(uuid, data.value.name)
  }
}
</script>

<template>
  <div
    ref="container"
    class="flex grow gap-2 items-center"
    :class="{ 'bg-gray-100': isDraggingOver || (isDraggingImageOver && node.isLeaf) }"
    @click.self="emit('nodeFilter', node.data as TreeNode)"
    @drop="onDrop"
    @dragover="isDraggingImageOver = true"
    @dragleave="isDraggingImageOver = false"
  >
    <img
      v-if="USE_ALGORITHM_SERVICE && (subjects.length !== 0)"
      :src="url"
      class="h-6 w-6 object-contain"
    >
    <div
      v-if="!isEditable"
      class="pointer-events-none"
      :class="{ 'text-teal-600 underline': isCategorySelected(data.name) }"
    >
      {{ data.name }}
    </div>
    <VInput
      v-else
      ref="input"
      :value="data.name"
      @update:value="submit"
    />

    <!-- Allow drop node as merge only for leaf nodes. -->
    <div
      v-if="node.isLeaf"
      v-show="isDraggingOver"
      class="border px-1 h-6 flex items-center text-gray"
      :class="{ 'border-black border-width-2': isInMergeZone }"
    >
      merge
    </div>

    <!-- Allow drop image as merge only for leaf nodes. -->
    <div
      v-if="node.isLeaf"
      class="border px-1 h-6 flex items-center text-gray"
      :class="{
        'border-black border-width-2': isInMultiLabelZone,
        'opacity-0': !isDraggingImageOver,
      }"
      @dragover="isInMultiLabelZone = true"
      @dragleave="isInMultiLabelZone = false"
    >
      multi-label
    </div>

    <div class="grow" />
    <div
      v-if="isHovered"
      class="items-center gap-1"
      flex="~ row"
    >
      <button
        v-if="(node.childNodes.length === 0) && USE_ALGORITHM_SERVICE && subjects.length >= 2"
        icon-btn
        class="i-fa6-solid:code-fork"
        title="Divide the images into multiple clusters"
        :disabled="isLocked"
        @click="emit('nodeDivide', node.data as TreeNode)"
      />
      <button
        v-if="node.childNodes.length !== 0"
        icon-btn
        class="i-fa6-solid:code-merge"
        title="Merge all the clusters"
        :disabled="isLocked"
        @click="emit('nodeFlatten', node.data as TreeNode)"
      />
      <button
        icon-btn
        class="i-fa6-solid:plus"
        title="Add a new child node"
        :disabled="isLocked"
        @click="emit('nodeAppend', node.data as TreeNode)"
      />
      <button
        icon-btn
        class="i-fa6-solid:pencil"
        title="Edit the node name"
        :disabled="isLocked"
        @click="onClickEdit"
      />
      <button
        icon-btn
        class="i-fa6-solid:trash"
        title="Remove the node"
        :disabled="isLocked"
        @click="emit('nodeRemove', node.data as TreeNode)"
      />
    </div>
    <div class="font-bold px-2">
      {{ annotationsByValue[data.name]?.length ?? 0 }}
    </div>
  </div>
</template>
