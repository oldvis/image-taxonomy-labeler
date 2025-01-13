<script setup lang="ts">
import type { Annotation } from '~/builtins/label-tasks/types'
import { storeToRefs } from 'pinia'
import { parseJsonFile, uploadFiles } from '~/plugins/file'
import { buildAnnotatorProfile, useStore } from '~/stores/profile'

interface TaskProgress {
  taskName: string
  categories: unknown[]
  annotations: Annotation[]
}

const { addProfiles } = useStore()
const { profiles } = storeToRefs(useStore())

/**
 * Generate a new node name that differs from existing node names,
 * based on a tentative name.
 */
const generateUniqueName = (
  name: string = 'new category',
  existingNames: string[],
): string => {
  if (!existingNames.includes(name)) return name
  const indices = new Set(existingNames
    .map((d) => {
      if (d === name) return 1
      const re = new RegExp(`${name} \\((?<index>[\\d+]*)\\)`)
      const index = d.match(re)?.groups?.index
      return Number(index)
    })
    .filter((d) => !Number.isNaN(d)))
  // Find the smallest index that is not in indices.
  for (let i = 2; i <= indices.size; i += 1) {
    if (!indices.has(i)) return `${name} (${i})`
  }
  return `${name} (${Math.max(...indices) + 1})`
}

const upload = async () => {
  const files = (await uploadFiles()) as FileList
  const existingUsernames = profiles.value.map((d) => d.username)
  const oldProfiles = await Promise.all(
    Array.from(files).map(async (file) => {
      const taskProgresses = await parseJsonFile(file) as TaskProgress[]
      const newUsername = generateUniqueName(file.name, existingUsernames)
      existingUsernames.push(newUsername)
      return buildAnnotatorProfile(taskProgresses, newUsername)
    }),
  )
  addProfiles(oldProfiles)
}
</script>

<template>
  <div class="flex gap-1 my-1">
    <button
      btn
      title="Upload a JSON file to restore the labeling progress"
      @click="upload"
    >
      upload
    </button>
  </div>
</template>
