<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SelectorType, useStore } from '~/stores/selector'

const store = useStore()
const { selectors } = storeToRefs(store)
const {
  removeSelector,
  toggleConsensusSelector,
  toggleDissensusSelector,
  toggleUnsureSelector,
} = store

const hasType = (type: SelectorType) => selectors.value.some((s) => s.type === type)
</script>

<template>
  <div class="strip border-b border-gray-200 dark:border-gray-700 select-none">
    <div class="flex shrink-0 gap-1.5 items-center">
      <div class="i-fa6-solid:filter text-gray-500 my-auto" />
      <span class="strip-label">Selectors</span>
    </div>
    <div class="flex items-center gap-1 overflow-x-auto overflow-y-hidden">
      <template
        v-for="(selector, i) in selectors"
        :key="selector.uuid"
      >
        <span
          v-if="i !== 0"
          class="strip-sep"
        >∩</span>
        <VSelector
          :selector="selector"
          class="text-nowrap"
          @remove-selector="removeSelector(selector.uuid)"
        />
      </template>
    </div>
    <div class="grow" />
    <div class="flex shrink-0 flex-wrap gap-1 items-center">
      <button
        type="button"
        :class="hasType(SelectorType.Dissensus) ? 'pill-on' : 'pill'"
        @click="toggleDissensusSelector"
      >
        Dissensus
      </button>
      <button
        type="button"
        :class="hasType(SelectorType.Consensus) ? 'pill-on' : 'pill'"
        @click="toggleConsensusSelector"
      >
        Consensus
      </button>
      <button
        type="button"
        :class="hasType(SelectorType.Unsure) ? 'pill-on' : 'pill'"
        @click="toggleUnsureSelector"
      >
        Unsure
      </button>
      <TheWidgetSearch class="shrink-0" />
    </div>
  </div>
</template>
