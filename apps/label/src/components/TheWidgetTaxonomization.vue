<script setup lang="ts">
import type { TreeNode } from '~/builtins/label-tasks/taxonomization/useLabelTask'
import { ElCheckbox, ElTreeSelect } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useLabelTask } from '~/builtins/label-tasks/taxonomization/useLabelTaskWithForest'
import { useOperators } from '~/builtins/label-tasks/taxonomization/useOperators'
import { useStore as useUserStore } from '~/stores/user'
import { useStore as useWorkspaceStore } from '~/stores/workspace'
import 'element-plus/es/components/tree-select/style/css'
import 'element-plus/es/components/checkbox/style/css'

const { uuid } = defineProps({
  /** The UUID of the visualization. */
  uuid: {
    type: String as PropType<string>,
    required: true,
  },
})

const { annotationsByUuid, forest } = useLabelTask()
const { uuidsLoaded } = storeToRefs(useWorkspaceStore())
const { name: userName } = storeToRefs(useUserStore())
const { assignTaxon, unassignTaxon } = useOperators(uuidsLoaded, userName)

/** The selected categories of the current image. */
const selected = computed(() => (
  [...new Set(annotationsByUuid.value[uuid]?.map((d) => d.value) ?? [])]
))

/** When clicking the checkbox of a tree node. */
const handleTreeCheck = (data: TreeNode) => {
  // Disallow checking non-leaf nodes.
  if (data.children.length > 0) return

  const checked = selected.value.includes(data.name)
  if (!checked) assignTaxon(uuid, data.name)
  else unassignTaxon(uuid, data.name)
}

/** When clicking the delete button of a label. */
const handleSelectRemoveTag = (name: string) => unassignTaxon(uuid, name)
</script>

<template>
  <div>
    <!--
      check-strictly: The checked state of a node not affects its father and child nodes.
      default-expand-all: Expand all nodes by default.
      multiple: Activate multiple-select.
    -->
    <ElTreeSelect
      :model-value="selected"
      :data="forest"
      :props="{ label: 'name' }"
      value-key="name"
      size="small"
      placement="left"
      filterable
      check-strictly
      default-expand-all
      multiple
      @remove-tag="handleSelectRemoveTag"
      @node-click="handleTreeCheck"
    >
      <template #default="{ data, node }">
        <div class="flex items-center gap-1 h-20px">
          <ElCheckbox
            v-if="node.isLeaf"
            :model-value="selected.includes(data.name)"
          />
          <div>{{ data.name }}</div>
        </div>
      </template>
    </ElTreeSelect>
  </div>
</template>
