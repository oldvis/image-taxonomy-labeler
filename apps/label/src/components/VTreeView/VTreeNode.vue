<script setup lang="ts">
import type { TreeNode } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/useLabelTask'
import type ElementNode from 'element-plus/es/components/tree/src/model/node'
import { getThumbnailUrl } from '@image-taxonomy-labeler/shared/services/image'
import { USE_ALGORITHM_SERVICE } from '@image-taxonomy-labeler/shared/services/params'
import { useLabelTask } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/useLabelTask'
import { onClickOutside, useElementHover } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { toRefs } from 'vue'
import { useOperators } from '~/builtins/label-tasks/taxonomization/useOperators'
import { findCenter } from '~/services/clustering'
import { useStore as useSelectorStore } from '~/stores/selector'
import { useStore as useUserStore } from '~/stores/user'
import { useStore as useWorkspaceStore } from '~/stores/workspace'
import VInput from './VInput.vue'

const props = defineProps({
  node: {
    type: Object as PropType<ElementNode>,
    required: true,
  },
  /** Inner node drop (as child or merge). False for before/after sibling insert. */
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

/** Must match the MIME set by Entries image dragstart (VImage). */
const IMAGE_DRAG_MIME = 'application/x-oldvis-image'

const isImageDrag = (e: DragEvent): boolean => (
  Array.from(e.dataTransfer?.types ?? []).includes(IMAGE_DRAG_MIME)
)

const getImageDragUuid = (e: DragEvent): string | undefined => (
  e.dataTransfer?.getData(IMAGE_DRAG_MIME)
  || e.dataTransfer?.getData('text/plain')
  || undefined
)

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
  return { url, centerUuid }
}

const { url } = useThumbnail(subjects)

const failed = ref(false)
watch(url, () => {
  failed.value = false
})
const onThumbnailError = (): void => {
  failed.value = true
}

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
/** Whether the user is dragging an image over the multi-label zone of this node. */
const isInMultiLabelZone = ref(false)

const onImageDragOver = (e: DragEvent): void => {
  if (!isImageDrag(e)) return
  e.preventDefault()
  isDraggingImageOver.value = true
  // Hovering the main row (not the multi chip) is single-label replace.
  if (!(e.target instanceof Element) || e.target.closest('[data-multi-label-zone]') === null) {
    isInMultiLabelZone.value = false
  }
}

const onImageDragLeave = (e: DragEvent): void => {
  // Ignore leave events that are only moving between children of this row.
  const related = e.relatedTarget
  if (related instanceof Node && container.value?.contains(related)) return
  isDraggingImageOver.value = false
  isInMultiLabelZone.value = false
}

const onMultiLabelDragOver = (e: DragEvent): void => {
  if (!isImageDrag(e)) return
  e.preventDefault()
  e.stopPropagation()
  isDraggingImageOver.value = true
  isInMultiLabelZone.value = true
}

const onMultiLabelDragLeave = (e: DragEvent): void => {
  const related = e.relatedTarget
  if (related instanceof Node && (e.currentTarget as Node | null)?.contains?.(related)) return
  isInMultiLabelZone.value = false
}

/**
 * Image → leaf drop:
 * - multi-label zone: ADD this node's label to the dragged image
 * - elsewhere on the leaf: REPLACE the image's leaf labels with this node's label
 * Tree-node move/merge is handled by ElTree (dragend), not here.
 */
const onDrop = (e: DragEvent) => {
  if (!isImageDrag(e)) return
  e.preventDefault()

  const { node } = toRefs(props)
  if (!node.value.isLeaf) {
    isDraggingImageOver.value = false
    isInMultiLabelZone.value = false
    return
  }

  const uuid = getImageDragUuid(e)
  // Prefer the drop target over hover state — dragleave often clears the flag first.
  const dropAsMultiLabel = (
    (e.target instanceof Element && e.target.closest('[data-multi-label-zone]') !== null)
    || isInMultiLabelZone.value
  )
  isDraggingImageOver.value = false
  isInMultiLabelZone.value = false
  if (uuid == null || uuid === '') return

  if (dropAsMultiLabel) {
    // ADD: keep existing labels, attach this taxon too.
    assignTaxon(uuid, data.value.name)
    return
  }

  // REPLACE: clear other leaf taxa, then assign this taxon.
  const leafCategories = (annotationsByUuid.value[uuid] ?? [])
    .map((d) => d.value)
    .filter((name) => {
      const match = categories.value.find((d) => d.name === name)
      if (match === undefined) return false
      return match.children.length === 0
    })
  leafCategories.forEach((name) => unassignTaxon(uuid, name))
  assignTaxon(uuid, data.value.name)
}

const dropChipBorder = (active: boolean): string => (
  active
    ? 'border-2 border-black'
    : 'border-2 border-gray-200 dark:border-gray-700'
)

const isDropTarget = computed(() => (
  props.isDraggingOver || (isDraggingImageOver.value && props.node.isLeaf)
))
const isRowOutlined = computed(() => (
  isDropTarget.value && !props.isInMergeZone && !isInMultiLabelZone.value
))
</script>

<template>
  <div
    ref="container"
    class="flex grow gap-2 items-center px-0.5"
    data-tree-row
    :class="{
      'bg-gray-100': isDropTarget,
      'outline outline-2 outline-black': isRowOutlined,
    }"
    @click.self="emit('nodeFilter', node.data as TreeNode)"
    @drop="onDrop"
    @dragover="onImageDragOver"
    @dragleave="onImageDragLeave"
  >
    <!-- Thumbnail is chrome for the row: drag here = node move/merge (same as the rest
         of the node). Image labeling drag starts from Entries only. -->
    <img
      v-if="USE_ALGORITHM_SERVICE && subjects.length !== 0 && url && !failed"
      :src="url"
      class="pointer-events-none h-5 w-5 object-contain"
      draggable="false"
      alt=""
      @error="onThumbnailError"
    >
    <div
      v-else-if="USE_ALGORITHM_SERVICE && subjects.length !== 0"
      class="i-fa6-solid:image shrink-0 text-sm text-gray-400 dark:text-gray-500"
      aria-hidden="true"
    />
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
      data-merge-zone
      class="flex h-5 items-center px-1 text-gray"
      :class="dropChipBorder(isInMergeZone)"
    >
      merge
    </div>

    <!-- Image drop: ADD this taxon's label (multi) vs REPLACE leaf labels (rest of row).
         pointer-events-none while hidden so it cannot steal node-drag hit-testing. -->
    <div
      v-if="node.isLeaf"
      data-multi-label-zone
      class="flex h-5 items-center px-1 text-gray"
      :class="[
        dropChipBorder(isInMultiLabelZone),
        { 'opacity-0 pointer-events-none': !isDraggingImageOver },
      ]"
      @dragover="onMultiLabelDragOver"
      @dragleave="onMultiLabelDragLeave"
      @drop="onDrop"
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
