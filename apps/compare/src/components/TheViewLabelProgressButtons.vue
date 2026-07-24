<script setup lang="ts">
import type { Annotation } from '~/builtins/label-tasks/types'
import { storeToRefs } from 'pinia'
import { parseJsonFile, uploadFiles } from '~/plugins/file'
import { useStore as useMessageStore } from '~/stores/message'
import { buildAnnotatorProfile, useStore } from '~/stores/profile'

interface TaskProgress {
  taskName: string
  categories: unknown[]
  annotations: Annotation[]
}

const { addProfiles } = useStore()
const { profiles } = storeToRefs(useStore())
const { addErrorMessage } = useMessageStore()

/**
 * Generate a new name that differs from existing names,
 * based on a tentative name.
 */
const generateUniqueName = (
  name: string = 'new category',
  existingNames: string[],
): string => {
  if (!existingNames.includes(name)) return name
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`^${escaped} \\((?<index>\\d+)\\)$`)
  const indices = new Set(
    existingNames
      .map((d) => {
        if (d === name) return 1
        const index = d.match(re)?.groups?.index
        return index === undefined ? Number.NaN : Number(index)
      })
      .filter((d) => !Number.isNaN(d)),
  )
  for (let i = 2; i <= indices.size + 1; i += 1) {
    if (!indices.has(i)) return `${name} (${i})`
  }
  return `${name} (${Math.max(...indices) + 1})`
}

const upload = async () => {
  const files = await uploadFiles()
  if (files == null) return

  let taskProgressesByFile: { file: File, taskProgresses: TaskProgress[] }[]
  try {
    taskProgressesByFile = await Promise.all(
      Array.from(files).map(async (file) => {
        const loaded = await parseJsonFile(file)
        if (!Array.isArray(loaded)) {
          throw new TypeError('Invalid JSON file')
        }
        return { file, taskProgresses: loaded as TaskProgress[] }
      }),
    )
  }
  catch {
    addErrorMessage('Invalid JSON file')
    return
  }

  const existingUsernames = profiles.value.map((d) => d.username)
  const oldProfiles = await Promise.all(
    taskProgressesByFile.map(({ file, taskProgresses }) => {
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
