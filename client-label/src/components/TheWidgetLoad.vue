<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useOperators } from '~/builtins/label-tasks/taxonomization/useOperators'
import { useStore as useUserStore } from '~/stores/user'
import { useStore as useWorkspaceStore } from '~/stores/workspace'

const workspaceStore = useWorkspaceStore()
const { uuidsAll, uuidsLoaded } = storeToRefs(workspaceStore)
const { name: userName } = storeToRefs(useUserStore())
const { loadAll, loadBatch } = workspaceStore
const { createTaxon } = useOperators(uuidsLoaded, userName)

const onClickLoadRemaining = () => {
  const oldUuidsLoadedSet = new Set(uuidsLoaded.value)
  loadAll()
  const newUuidsLoaded = uuidsLoaded.value
  const addedUuids = newUuidsLoaded.filter((d) => !oldUuidsLoadedSet.has(d))

  // When new visualizations are loaded, store them to a new node.
  if (addedUuids.length > 0) {
    createTaxon('new batch', addedUuids)
  }
}
const onClickLoad100 = () => {
  const oldUuidsLoadedSet = new Set(uuidsLoaded.value)
  loadBatch(100)
  const newUuidsLoaded = uuidsLoaded.value
  const addedUuids = newUuidsLoaded.filter((d) => !oldUuidsLoadedSet.has(d))

  // When new visualizations are loaded, store them to a new node.
  if (addedUuids.length > 0) {
    createTaxon('new batch', addedUuids)
  }
}
</script>

<template>
  <div class="flex gap-2">
    <button
      btn
      title="Load remaining images to the workspace"
      :disabled="uuidsAll.length === uuidsLoaded.length"
      @click="onClickLoadRemaining"
    >
      load remaining ({{ uuidsAll.length - uuidsLoaded.length }})
    </button>
    <button
      btn
      title="Load 100 images to the workspace"
      :disabled="uuidsAll.length === uuidsLoaded.length"
      @click="onClickLoad100"
    >
      load 100
    </button>
  </div>
</template>
