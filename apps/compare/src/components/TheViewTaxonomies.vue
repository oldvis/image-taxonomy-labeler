<script setup lang="ts">
import type { TreeNodeWithUsers } from '~/stores/profile'
import { intersection } from 'lodash'
import { storeToRefs } from 'pinia'
import { useStore as useProfileStore } from '~/stores/profile'
import { useStore as useSelectorStore } from '~/stores/selector'
import { invertTaxaBySubject, overlapCounts, uniqueSubjectsForTaxon } from '~/utils/taxonSubjectIndex'

const profileStore = useProfileStore()
const { profiles, mergedForest } = storeToRefs(profileStore)
const { removeProfile, updateUsername } = profileStore

const {
  clearCategorySelectors,
  toggleCategorySelector,
} = useSelectorStore()

/**
 * subjectsByUsernameByTaxon[username][taxon]
 * stores the UUIDs of images assigned to `taxon`
 * by the annotator with the given `username`.
 */
const subjectsByUsernameByTaxon = computed(() => (
  profiles.value.map((d) => {
    // subjectsByTaxon[taxon] stores the UUIDs of images assigned to `taxon`
    // by the annotator with the given profile `d`.
    const subjectsByTaxon = d.annotations.reduce((acc, d) => {
      if (!acc[d.value]) acc[d.value] = []
      acc[d.value].push(d.subject)
      return acc
    }, {} as Record<string, string[]>)

    // Deduplicate the UUIDs of images.
    Object.keys(subjectsByTaxon).forEach((taxon) => {
      subjectsByTaxon[taxon] = [...new Set(subjectsByTaxon[taxon])]
    })
    return subjectsByTaxon
  }).reduce((acc, d, i) => {
    acc[profiles.value[i].username] = d
    return acc
  }, {} as Record<string, Record<string, string[]>>)
))

/**
 * Get the UUIDs of images assigned to `taxon`
 * by the annotator with the given `username`.
 */
const getSubjects = (username: string, taxon: string): string[] => {
  if (!(username in subjectsByUsernameByTaxon.value)) return []
  if (!(taxon in subjectsByUsernameByTaxon.value[username])) return []
  return subjectsByUsernameByTaxon.value[username][taxon]
}

/**
 * subjectsUnionByTaxon[taxon]
 * stores the UUIDs of images assigned to `taxon`
 * in the union merged taxonomy forest
 * by at least one user.
 */
const subjectsUnionByTaxon = computed(() => {
  const result = profiles.value.reduce((acc, d) => {
    d.annotations.forEach((d) => {
      if (!acc[d.value]) acc[d.value] = []
      acc[d.value].push(d.subject)
    })
    return acc
  }, {} as Record<string, string[]>)

  // Deduplicate the UUIDs of images.
  Object.keys(result).forEach((taxon) => {
    result[taxon] = [...new Set(result[taxon])]
  })
  return result
})

/**
 * Get the UUIDs of images assigned to `taxon`
 * by at least one annotator.
 */
const getSubjectsUnion = (taxon: string): string[] => {
  if (!(taxon in subjectsUnionByTaxon.value)) return []
  return subjectsUnionByTaxon.value[taxon]
}

/**
 * subjectsIntersectionByTaxon[taxon]
 * stores the UUIDs of images assigned to `taxon`
 * in the merged taxonomy forest
 * by all users.
 */
const subjectsIntersectionByTaxon = computed(() => (
  Object.entries(subjectsByUsernameByTaxon.value)
    .reduce((acc, [_, subjectsByTaxon]) => {
      Object.entries(subjectsByTaxon).forEach(([taxon, subjects]) => {
        if (!acc[taxon]) acc[taxon] = subjects
        else acc[taxon] = intersection(acc[taxon], subjects)
      })
      return acc
    }, {} as Record<string, string[]>)
))

/**
 * Get the UUIDs of images assigned to `taxon`
 * by all annotators.
 */
const getSubjectsIntersection = (taxon: string): string[] => {
  if (!(taxon in subjectsIntersectionByTaxon.value)) return []
  return subjectsIntersectionByTaxon.value[taxon]
}

/** Cold: subject → taxa on the merged union subject lists. */
const unionTaxaBySubject = computed(() => invertTaxaBySubject(subjectsUnionByTaxon.value))

/** Cold: per annotator, subject → taxa. */
const taxaBySubjectByUsername = computed(() => {
  const out: Record<string, ReturnType<typeof invertTaxaBySubject>> = {}
  for (const [username, byTaxon] of Object.entries(subjectsByUsernameByTaxon.value)) {
    out[username] = invertTaxaBySubject(byTaxon)
  }
  return out
})

/** Hot: merged-tree highlight bar / text. `counts[taxon]` overlap size. */
const unionOverlapCounts = ref<Record<string, number>>({})
/** Hot: profile-tree highlight. `counts[username][taxon]`. */
const overlapCountsByUsername = ref<Record<string, Record<string, number>>>({})

const clearHover = (): void => {
  unionOverlapCounts.value = {}
  overlapCountsByUsername.value = {}
}

const onNodeClick = (name: string): void => {
  // Add a data entry selector with the node name.
  clearCategorySelectors()
  toggleCategorySelector(name)
}

/**
 * Hot path: unique subjects for the taxon, then one inverted walk to fill overlap maps.
 * Per-node class/bar is O(1) lookup. Do not intersection UUID arrays per node.
 *
 * Compare e2e (`pnpm exec playwright test --project=compare`, 12k anns, 81 bars):
 * last-bar mean ~3ms (was ~465ms); paint mean ~14ms (was ~467ms).
 */
const onNodeHover = (name: string): void => {
  const subjects = uniqueSubjectsForTaxon(subjectsByUsernameByTaxon.value, name)
  unionOverlapCounts.value = overlapCounts(subjects, unionTaxaBySubject.value)
  const byUser: Record<string, Record<string, number>> = {}
  for (const [username, inverted] of Object.entries(taxaBySubjectByUsername.value)) {
    byUser[username] = overlapCounts(subjects, inverted)
  }
  overlapCountsByUsername.value = byUser
}

const textColumnNumberStart = 220
const textColumnDiffStart = 260
const barColumnStart = 220
const barWidth = 30
</script>

<template>
  <!-- Viewing taxonomies using VIndentedTree component. -->
  <div view-container>
    <div view-header>
      <div class="i-fa6-solid:sitemap text-gray-500 shrink-0" />
      <span class="strip-label">Taxonomies</span>
      <div class="grow" />
      <div
        v-if="profiles.length !== 0"
        class="strip-meta flex flex-wrap items-center gap-x-1.5"
      >
        <span>Merged</span>
        <span
          class="strip-sep"
          aria-hidden="true"
        >·</span>
        <span>
          <span class="strip-strong">{{ profiles.length }}</span> profiles
        </span>
      </div>
    </div>
    <div
      v-if="profiles.length !== 0"
      class="min-h-0 flex-1 overflow-auto"
    >
      <!--
        Scroll the row, not the columns. Stretching inside overflow-auto
        only matches the panel viewport, so borders would stop when scrolling.
      -->
      <div class="flex items-stretch gap-2 px-1">
        <!--
        For each taxon,
        - the text columns show
          1. the number of images assigned to the taxon
          2. (for the merged tree) the users whose taxonomy includes the taxon
        - the bar columns show
          1. a bar encoding the number of images assigned to the taxon
            - for the merged tree, this number is the union of the annotations of all users
          2. a bar encoding the number of images that overlaps with the images assigned to hovered taxon
          3. (for the merged tree) a bar encoding the number of images with different annotations
      -->
        <TheViewTaxonomiesIndentedTree
          class="grow basis-25%"
          :forest="mergedForest"
          label="Merged"
          :tree-text-class-map="(d) => (
            (unionOverlapCounts[d.data.name] ?? 0) > 0
              ? 'fill-#4682B4'
              : 'dark:fill-gray-300'
          )"
          :text-columns="[{
            value: (d) => getSubjectsUnion(d.name).length.toString(),
            x: textColumnNumberStart,
            textAnchor: 'end',
            class: 'dark:fill-gray-300',
          }, {
            value: (d: TreeNodeWithUsers) => (d.usernames.length === profiles.length)
              ? ''
              : d.usernames.join(', '),
            x: textColumnDiffStart,
            textAnchor: 'start',
            class: 'fill-#c65319',
          }]"
          :bar-columns="[{
            value: (d) => getSubjectsUnion(d.name).length,
            x: barColumnStart,
            class: 'dark:fill-gray-300',
            domain: [0, getSubjectsUnion('root').length],
            barWidth,
          }, {
            value: (d) => (
              getSubjectsUnion(d.name).length
              - getSubjectsIntersection(d.name).length
            ),
            x: barColumnStart,
            class: 'fill-#c65319',
            domain: [0, getSubjectsUnion('root').length],
            barWidth,
          }, {
            value: (d) => unionOverlapCounts[d.name] ?? 0,
            x: barColumnStart,
            class: 'fill-#4682B4',
            domain: [0, getSubjectsUnion('root').length],
            barWidth,
          }]"
          :show-toolbar="false"
          @hover-node="onNodeHover"
          @leave-node="clearHover"
          @click-node="onNodeClick"
        />
        <TheViewTaxonomiesIndentedTree
          v-for="(profile, i) in profiles"
          :key="i"
          class="border-l border-gray-200 pl-1 basis-23% dark:border-gray-700"
          :forest="profile.forest"
          :label="profile.username"
          :tree-text-class-map="(d) => (
            (overlapCountsByUsername[profile.username]?.[d.data.name] ?? 0) > 0
              ? 'fill-#4682B4'
              : 'dark:fill-gray-300'
          )"
          :text-columns="[{
            value: (d) => getSubjects(profile.username, d.name).length.toString(),
            x: textColumnNumberStart,
            textAnchor: 'end',
            class: 'dark:fill-gray-300',
          }]"
          :bar-columns="[{
            value: (d) => getSubjects(profile.username, d.name).length,
            x: barColumnStart,
            class: 'dark:fill-gray-300',
            domain: [0, getSubjectsUnion('root').length],
            barWidth,
          }, {
            value: (d) => overlapCountsByUsername[profile.username]?.[d.name] ?? 0,
            x: barColumnStart,
            class: 'fill-#4682B4',
            domain: [0, getSubjectsUnion('root').length],
            barWidth,
          }]"
          :show-toolbar="true"
          @hover-node="onNodeHover"
          @leave-node="clearHover"
          @click-node="onNodeClick"
          @update:label="updateUsername(i, $event)"
          @remove="removeProfile(i)"
        />
      </div>
    </div>
    <div
      v-else
      class="m-auto text-sm text-gray-500 p-3 dark:text-gray-400"
    >
      Please upload annotations
    </div>
  </div>
</template>
