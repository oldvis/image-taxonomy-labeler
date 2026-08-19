<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStore as useProfileStore } from '~/stores/profile'

const { subjectUuids, dissensusUuids, consensusUuids, unsureUuids } = storeToRefs(useProfileStore())
</script>

<template>
  <div class="strip border-t border-gray-200 dark:border-gray-700 select-none">
    <div class="flex shrink-0 gap-1.5 items-center">
      <div class="i-fa6-solid:list-check text-gray-500 my-auto" />
      <span class="strip-label">Progress</span>
    </div>
    <div class="strip-meta flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
      <span>
        labeled <span class="strip-strong">{{ subjectUuids.length }}</span>
      </span>
      <span
        class="strip-sep"
        aria-hidden="true"
      >·</span>
      <span>
        dissensus <span class="strip-strong">{{ dissensusUuids.length }}</span>
      </span>
      <span
        class="strip-sep"
        aria-hidden="true"
      >·</span>
      <span>
        consensus <span class="strip-strong">{{ consensusUuids.length }}</span>
      </span>
      <span
        class="strip-sep"
        aria-hidden="true"
      >·</span>
      <span>
        unsure <span class="strip-strong">{{ unsureUuids.length }}</span>
      </span>
    </div>
    <div class="grow" />
    <TheViewLabelProgressButtons />
  </div>
</template>
