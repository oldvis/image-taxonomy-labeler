<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStore as useProfileStore } from '~/stores/profile'

const { subjectUuids, dissensusUuids, consensusUuids, unsureUuids } = storeToRefs(useProfileStore())
</script>

<template>
  <div
    class="flex gap-1 px-1 select-none"
    border="~ gray-200"
  >
    <div class="flex gap-1 text-sm">
      <div class="i-fa6-solid:list-check my-auto" />
      <div class="font-bold my-auto">
        Progress
      </div>
    </div>
    <div class="flex gap-1 text-sm">
      <template
        v-for="(d, i) in [
          { title: '#Labeled:', value: `${subjectUuids.length}` },
          { title: '#Dissensus:', value: `${dissensusUuids.length}` },
          { title: '#Consensus:', value: `${consensusUuids.length}` },
          { title: '#Unsure:', value: `${unsureUuids.length}` },
        ]" :key="d.title"
      >
        <div v-if="i === 0" class="border-l my-1" />
        <div class="flex gap-1 my-auto grow">
          {{ d.title }}
          <div class="font-bold">
            {{ d.value }}
          </div>
        </div>
        <div class="border-l my-1" />
      </template>
    </div>
    <div class="grow" />
    <TheViewLabelProgressButtons />
  </div>
</template>
