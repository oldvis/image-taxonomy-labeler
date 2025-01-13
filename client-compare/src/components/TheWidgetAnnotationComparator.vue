<script setup lang="ts">
import { intersection } from 'lodash'
import { storeToRefs } from 'pinia'
import { useStore as useProfileStore } from '~/stores/profile'
import 'element-plus/es/components/tree-select/style/css'
import 'element-plus/es/components/checkbox/style/css'

const { uuid } = defineProps({
  /** The UUID of the visualization. */
  uuid: {
    type: String as PropType<string>,
    required: true,
  },
})

const { profiles, taxaSorted } = storeToRefs(useProfileStore())

const usernames = computed(() => profiles.value.map((d) => d.username))

/**
 * taxaByUsername[username] stores the taxa assigned to the image
 * by the annotator with the given `username`.
 */
const taxaByUsername = computed(() => (
  Object.fromEntries(profiles.value.map(
    (d) => [
      d.username,
      d.annotations.filter((d) => d.subject === uuid).map((d) => d.value),
    ],
  ))
))

/** The intersection of taxa assigned to the image by all annotators. */
const taxaIntersection = computed(() => (
  intersection(...Object.values(taxaByUsername.value))
))

/**
 * isUnsureByUsername[username] stores whether the image is labeled unsure
 * by the annotator with the given `username`.
 */
const isUnsureByUsername = computed(() => (
  Object.fromEntries(profiles.value.map(
    (d) => [d.username, d.unsureUuids.includes(uuid)],
  ))
))

const sortByDepthFirstTraversal = (taxa: string[]) => (
  taxa.sort((a, b) => taxaSorted.value.indexOf(a) - taxaSorted.value.indexOf(b))
)
</script>

<template>
  <div class="border bg-white dark:bg-hex-121212 p-1">
    <div
      v-for="(username, i) in usernames"
      :key="i"
      :class="{ 'border-t': i !== 0 }"
    >
      <p class="text-gray-400">
        {{ username }}
        <template v-if="isUnsureByUsername[username]">
          (unsure)
        </template>
      </p>
      <p class="font-bold">
        <span
          v-for="(d, j) in sortByDepthFirstTraversal(taxaByUsername[username])"
          :key="j"
        >
          {{ j === 0 ? '' : ', ' }}
          <span :class="{ 'text-#c65319': !taxaIntersection.includes(d) }">
            {{ d }}
          </span>
        </span>
      </p>
    </div>
  </div>
</template>
